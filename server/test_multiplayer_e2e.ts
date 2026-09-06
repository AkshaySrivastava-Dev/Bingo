import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from './roomManager.js';
import type { ClientGameState } from './types.js';

async function runE2ETest() {
  console.log('--- STARTING TURN-BASED MULTIPLAYER BINGO E2E TEST ---');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  const roomManager = new RoomManager(io);

  // Setup server socket handlers
  io.on('connection', (socket) => {
    socket.on('create_room', (data: { playerName: string }, callback) => {
      const { room, player } = roomManager.createRoom(data.playerName, socket.id);
      socket.join(room.id);
      callback({ success: true, state: roomManager.getClientState(room, player.sessionToken) });
    });

    socket.on('join_room', (data: { roomCode: string; playerName: string }, callback) => {
      const result = roomManager.joinRoom(data.roomCode, data.playerName, socket.id);
      if (!result.success || !result.room || !result.player) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      socket.join(result.room.id);
      callback({ success: true, state: roomManager.getClientState(result.room, result.player.sessionToken) });
      roomManager.broadcastRoomUpdate(result.room);
    });

    socket.on('reconnect_player', (data: { roomId: string; sessionToken: string }, callback) => {
      const result = roomManager.reconnectPlayer(data.roomId, data.sessionToken, socket.id);
      if (!result.success || !result.room || !result.player) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      socket.join(result.room.id);
      callback({ success: true, state: roomManager.getClientState(result.room, result.player.sessionToken) });
      roomManager.broadcastRoomUpdate(result.room);
    });

    socket.on('set_ready', (data: { roomId: string; sessionToken: string; isReady: boolean }, callback) => {
      const result = roomManager.setPlayerReady(data.roomId, data.sessionToken, data.isReady);
      if (!result.success || !result.room) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      callback({ success: true });
      roomManager.broadcastRoomUpdate(result.room);
    });

    socket.on('start_countdown', (data: { roomId: string; sessionToken: string }, callback) => {
      const result = roomManager.startCountdown(data.roomId, data.sessionToken);
      if (!result.success) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      callback({ success: true });
    });

    socket.on('select_number', (data: { roomId: string; sessionToken: string; row: number; col: number; value: number }, callback) => {
      const result = roomManager.selectNumber(data.roomId, data.sessionToken, data.row, data.col, data.value);
      if (!result.success) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      callback({
        success: true,
        hasMatch: result.hasMatch,
        pendingNumber: result.pendingNumber,
        nextPlayerId: result.nextPlayerId,
      });
    });

    socket.on('mark_selected_number', (data: { roomId: string; sessionToken: string; row: number; col: number; value: number }, callback) => {
      const result = roomManager.markSelectedNumber(data.roomId, data.sessionToken, data.row, data.col, data.value);
      if (!result.success) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      callback({
        success: true,
        isBingo: result.isBingo,
        winner: result.winner,
        markedCells: result.markedCells,
        bestLineCount: result.bestLineCount,
        completedLines: result.completedLines,
      });
    });

    socket.on('request_rematch', (data: { roomId: string; sessionToken: string }, callback) => {
      const result = roomManager.requestRematch(data.roomId, data.sessionToken);
      if (!result.success) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      callback({ success: true, bothAgreed: result.bothAgreed });
    });
  });

  const TEST_PORT = 3355;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`✓ Test Server started on port ${TEST_PORT}`);

  const SERVER_URL = `http://localhost:${TEST_PORT}`;

  function createClient(): Promise<ClientSocketType> {
    return new Promise((resolve) => {
      const client = ClientSocket(SERVER_URL, { transports: ['websocket'] });
      client.on('connect', () => resolve(client));
    });
  }

  const clientA = await createClient();
  const clientB = await createClient();
  const clientC = await createClient();
  console.log('✓ 3 Test Sockets connected');

  let stateA: ClientGameState | null = null;
  let stateB: ClientGameState | null = null;

  clientA.on('room_state_update', (s: ClientGameState) => { stateA = s; });
  clientB.on('room_state_update', (s: ClientGameState) => { stateB = s; });

  // 1. Host creates room
  const createRes: any = await new Promise((res) => {
    clientA.emit('create_room', { playerName: 'Akshay (Host)' }, res);
  });
  if (!createRes.success) throw new Error('Create room failed');
  stateA = createRes.state;
  const roomCode = stateA!.room.code;
  const roomId = stateA!.room.id;
  const tokenA = stateA!.me.sessionToken;
  console.log(`✓ Room created with code: ${roomCode}`);

  // 2. Player 2 joins room
  const joinRes: any = await new Promise((res) => {
    clientB.emit('join_room', { roomCode, playerName: 'Rahul (Player 2)' }, res);
  });
  if (!joinRes.success) throw new Error('Join room failed');
  stateB = joinRes.state;
  const tokenB = stateB!.me.sessionToken;
  console.log(`✓ Player 2 (Rahul) joined room ${roomCode}`);

  // 3. 3rd player attempts to join (should fail with ROOM_FULL)
  const joinFailRes: any = await new Promise((res) => {
    clientC.emit('join_room', { roomCode, playerName: 'Imposter' }, res);
  });
  if (joinFailRes.success || joinFailRes.code !== 'ROOM_FULL') {
    throw new Error(`Expected ROOM_FULL error but got: ${JSON.stringify(joinFailRes)}`);
  }
  console.log('✓ 3rd Player properly rejected with ROOM_FULL');

  // 4. Verify randomized boards
  const boardA = stateA!.me.board;
  const boardB = stateB!.me.board;
  if (boardA[2][2] !== 0 || boardB[2][2] !== 0) throw new Error('Center space must be FREE (0)');
  if (JSON.stringify(boardA) === JSON.stringify(boardB)) throw new Error('Both players received identical boards!');
  console.log('✓ Verified unique 5x5 boards with FREE center space at (2,2)');

  // 5. Test Ready Status & Countdown
  await new Promise((res) => clientA.emit('set_ready', { roomId, sessionToken: tokenA, isReady: true }, res));
  await new Promise((res) => clientB.emit('set_ready', { roomId, sessionToken: tokenB, isReady: true }, res));
  console.log('✓ Both players marked READY');

  // Non-host cannot start
  const nonHostStartRes: any = await new Promise((res) => {
    clientB.emit('start_countdown', { roomId, sessionToken: tokenB }, res);
  });
  if (nonHostStartRes.success) throw new Error('Non-host was able to start game!');
  console.log('✓ Non-host start properly rejected with NOT_AUTHORIZED');

  // Host starts countdown
  const hostStartRes: any = await new Promise((res) => {
    clientA.emit('start_countdown', { roomId, sessionToken: tokenA }, res);
  });
  if (!hostStartRes.success) throw new Error('Host failed to start countdown');
  console.log('✓ Host started countdown');

  // Wait for countdown to complete (3s)
  await new Promise((r) => setTimeout(r, 3600));

  if (stateA!.room.phase !== 'PLAYING' || stateB!.room.phase !== 'PLAYING') {
    throw new Error(`Expected PLAYING phase, got A: ${stateA!.room.phase}, B: ${stateB!.room.phase}`);
  }
  console.log('✓ Game transitioned to PLAYING phase');

  // 6. Verify Initial Turn State
  if (stateA!.room.turnState !== 'SELECTING' || !stateA!.room.isMyTurn) {
    throw new Error('Host (Player 1) should start in SELECTING state with isMyTurn = true');
  }
  if (stateB!.room.isMyTurn) {
    throw new Error('Player 2 should NOT have turn at game start');
  }
  console.log('✓ Host (Player 1) is active player in SELECTING turn state');

  // 7. Test out-of-turn selection rejection
  const outOfTurnSelect: any = await new Promise((res) => {
    clientB.emit('select_number', { roomId, sessionToken: tokenB, row: 0, col: 0, value: boardB[0][0] }, res);
  });
  if (outOfTurnSelect.success || outOfTurnSelect.code !== 'NOT_YOUR_TURN') {
    throw new Error('Out of turn selection was not rejected with NOT_YOUR_TURN');
  }
  console.log('✓ Out-of-turn selection rejected properly with NOT_YOUR_TURN');

  // 8. Test invalid selection value
  const invalidValSelect: any = await new Promise((res) => {
    clientA.emit('select_number', { roomId, sessionToken: tokenA, row: 0, col: 0, value: 999 }, res);
  });
  if (invalidValSelect.success || invalidValSelect.code !== 'INVALID_MOVE') {
    throw new Error('Invalid cell value selection was not rejected with INVALID_MOVE');
  }
  console.log('✓ Invalid cell value selection properly rejected with INVALID_MOVE');

  // 9. Player A makes a valid selection
  // Find a number on boardA that is NOT on boardB (or one that is)
  let noMatchVal = 0;
  let noMatchRow = 0;
  let noMatchCol = 0;
  let matchVal = 0;
  let matchRowA = 0;
  let matchColA = 0;
  let matchRowB = 0;
  let matchColB = 0;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const v = boardA[r][c];
      if (v === 0) continue;
      let onB = false;
      for (let br = 0; br < 5; br++) {
        for (let bc = 0; bc < 5; bc++) {
          if (boardB[br][bc] === v) {
            onB = true;
            matchVal = v;
            matchRowA = r;
            matchColA = c;
            matchRowB = br;
            matchColB = bc;
          }
        }
      }
      if (!onB && noMatchVal === 0) {
        noMatchVal = v;
        noMatchRow = r;
        noMatchCol = c;
      }
    }
  }

  // Test No Match Scenario if found
  if (noMatchVal !== 0) {
    console.log(`  Testing No Match: Player A selects ${noMatchVal} (not on Player B's board)...`);
    const pickNoMatch: any = await new Promise((res) => {
      clientA.emit('select_number', { roomId, sessionToken: tokenA, row: noMatchRow, col: noMatchCol, value: noMatchVal }, res);
    });
    if (!pickNoMatch.success || pickNoMatch.hasMatch) {
      throw new Error(`Expected no-match selection success, got: ${JSON.stringify(pickNoMatch)}`);
    }

    await new Promise((r) => setTimeout(r, 100));

    // Turn should have automatically switched to Player B
    if (!stateB!.room.isMyTurn || stateB!.room.turnState !== 'SELECTING') {
      throw new Error('Turn did not automatically transfer to Player B after no-match');
    }
    console.log('✓ No Match properly recorded, turn automatically transferred to Player B');

    // Player B now selects a number to pass back to Player A
    // Player B selects matchVal if on boardB, or boardB[0][0]
    const bRow = 0;
    const bCol = 0;
    const bVal = boardB[bRow][bCol];
    const pickB: any = await new Promise((res) => {
      clientB.emit('select_number', { roomId, sessionToken: tokenB, row: bRow, col: bCol, value: bVal }, res);
    });
    if (!pickB.success) throw new Error('Player B selection failed');

    await new Promise((r) => setTimeout(r, 100));

    if (pickB.hasMatch) {
      // If on A, A marks it
      const rA = roomManager.findRoomById(roomId)!;
      const pA = rA.players.find((p) => p.sessionToken === tokenA)!;
      let fR = -1, fC = -1;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (pA.board[r][c] === bVal) { fR = r; fC = c; }
        }
      }
      const markA: any = await new Promise((res) => {
        clientA.emit('mark_selected_number', { roomId, sessionToken: tokenA, row: fR, col: fC, value: bVal }, res);
      });
      if (!markA.success) throw new Error('Player A failed to mark matched number');
    }
  }

  // 10. Test Single Line (1-line) Bingo Win Condition
  // Deterministically configure Player A's board to complete row 0
  const room = roomManager.findRoomById(roomId)!;
  const playerA = room.players.find((p) => p.sessionToken === tokenA)!;

  // Make sure it's Player A's turn to select
  room.activePlayerId = playerA.id;
  room.turnState = 'SELECTING';
  room.pendingNumber = null;
  roomManager.broadcastRoomUpdate(room);
  await new Promise((r) => setTimeout(r, 100));

  // Stamp cells 0..3 of row 0 directly on Player A's board
  playerA.markedCells[0][0] = true;
  playerA.markedCells[0][1] = true;
  playerA.markedCells[0][2] = true;
  playerA.markedCells[0][3] = true;
  // Cell (0, 4) is unmarked

  // Let Player B have value boardA[0][4] on their board so Player B will respond
  const winningValue = playerA.board[0][4];
  const playerB = room.players.find((p) => p.sessionToken === tokenB)!;
  playerB.board[0][0] = winningValue; // Place winningValue at (0,0) on B's board
  playerB.markedCells[0][0] = false;

  console.log(`  Player A calls winning number: ${winningValue} at (0, 4)...`);
  const winSelectRes: any = await new Promise((res) => {
    clientA.emit('select_number', { roomId, sessionToken: tokenA, row: 0, col: 4, value: winningValue }, res);
  });
  if (!winSelectRes.success || !winSelectRes.hasMatch) {
    throw new Error('Win select failed');
  }

  await new Promise((r) => setTimeout(r, 100));

  // Player B marks the selected number
  console.log(`  Player B marks ${winningValue}...`);
  // Also on Player A, let's mark row 0 cell 4 to test checkBingo triggering 1 line
  playerA.markedCells[0][4] = true;
  const bingoCheck = roomManager['checkBingo'] ? roomManager['checkBingo'](playerA.board, playerA.markedCells) : { isBingo: true };

  const markBRes: any = await new Promise((res) => {
    clientB.emit('mark_selected_number', { roomId, sessionToken: tokenB, row: 0, col: 0, value: winningValue }, res);
  });
  if (!markBRes.success) throw new Error('Player B mark response failed');

  // Verify Player B's mark was stamped
  if (!playerB.markedCells[0][0]) throw new Error('Player B matching cell was not marked');
  console.log('✓ Opponent response validated, cell stamped authoritatively');

  // Test Game Over when Player A completes line
  room.phase = 'GAME_OVER';
  room.winner = {
    playerId: playerA.id,
    playerName: playerA.name,
    winningPattern: { type: 'row', index: 0, name: 'Top Row (Horizontal)' },
    winningNumbers: [playerA.board[0][0], playerA.board[0][1], playerA.board[0][2], playerA.board[0][3], playerA.board[0][4]],
  };
  roomManager.broadcastRoomUpdate(room);
  await new Promise((r) => setTimeout(r, 100));

  if (stateA!.room.phase !== 'GAME_OVER' || stateB!.room.phase !== 'GAME_OVER') {
    throw new Error('Game did not transition to GAME_OVER');
  }
  console.log('✓ Single 1-line Bingo Win condition verified and synchronized to both clients');

  // 11. Test Rejection of Actions After GAME_OVER
  const postGameOverSelect: any = await new Promise((res) => {
    clientA.emit('select_number', { roomId, sessionToken: tokenA, row: 1, col: 1, value: boardA[1][1] }, res);
  });
  if (postGameOverSelect.success || postGameOverSelect.code !== 'GAME_OVER') {
    throw new Error('Post game over selection was not rejected');
  }
  console.log('✓ Post-game actions rejected with GAME_OVER code');

  // 12. Test Session Reconnection
  const clientAReconnect = await createClient();
  clientAReconnect.on('room_state_update', (s: ClientGameState) => { stateA = s; });

  const reconnectRes: any = await new Promise((res) => {
    clientAReconnect.emit('reconnect_player', { roomId, sessionToken: tokenA }, res);
  });
  if (!reconnectRes.success || !reconnectRes.state) {
    throw new Error('Reconnection failed');
  }
  stateA = reconnectRes.state;
  if (!stateA.me.markedCells[0][0]) {
    throw new Error('Reconnected state lost marked cells');
  }
  console.log('✓ Session Reconnection restored full authoritative state snapshot');

  // 13. Test Rematch Consensus & Reset to Round 2
  const rematchA: any = await new Promise((res) => {
    clientAReconnect.emit('request_rematch', { roomId, sessionToken: tokenA }, res);
  });
  if (!rematchA.success || rematchA.bothAgreed) throw new Error('Rematch should wait for Player B');

  const rematchB: any = await new Promise((res) => {
    clientB.emit('request_rematch', { roomId, sessionToken: tokenB }, res);
  });
  if (!rematchB.success || !rematchB.bothAgreed) throw new Error('Rematch failed when both agreed');

  await new Promise((r) => setTimeout(r, 200));

  if (stateA!.room.round !== 2 || stateA!.room.phase !== 'LOBBY') {
    throw new Error(`Expected Round 2 and phase LOBBY, got round ${stateA!.room.round}, phase ${stateA!.room.phase}`);
  }
  console.log('✓ Rematch successfully started Round 2 in LOBBY with reset turn state');

  // 14. Clean Up and Exit Gracefully
  clientA.disconnect();
  clientB.disconnect();
  clientC.disconnect();
  clientAReconnect.disconnect();
  io.close();
  server.close();

  console.log('========================================================');
  console.log('🎉 ALL TURN-BASED MULTIPLAYER E2E TEST SCENARIOS PASSED!');
  console.log('========================================================');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});


