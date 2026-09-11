import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from './roomManager.js';
import type { ClientGameState, GameMode, BingoItem } from './types.js';

async function runE2ETest() {
  console.log('=== STARTING MULTI-MODE FAST TURN-BASED BINGO E2E TEST ===\n');

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

    socket.on('set_game_mode', (data: { roomId: string; sessionToken: string; mode: GameMode }, callback) => {
      const result = roomManager.setGameMode(data.roomId, data.sessionToken, data.mode);
      if (!result.success) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      callback({ success: true, mode: result.mode });
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

    socket.on('select_item', (data: { roomId: string; sessionToken: string; row: number; col: number; item: BingoItem }, callback) => {
      const result = roomManager.selectItem(data.roomId, data.sessionToken, data.row, data.col, data.item);
      if (!result.success) {
        callback({ success: false, code: result.errorCode, message: result.errorMessage });
        return;
      }
      callback({
        success: true,
        isBingo: result.isBingo,
        winner: result.winner,
        nextPlayerId: result.nextPlayerId,
        moveRecord: result.moveRecord,
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
  });

  const TEST_PORT = 3366;
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
  console.log(`✓ Room created with code: ${roomCode}, default mode: ${stateA!.room.mode}`);

  // 2. Player 2 joins room
  const joinRes: any = await new Promise((res) => {
    clientB.emit('join_room', { roomCode, playerName: 'Rohan (Player 2)' }, res);
  });
  if (!joinRes.success) throw new Error('Join room failed');
  stateB = joinRes.state;
  const tokenB = stateB!.me.sessionToken;
  console.log(`✓ Player 2 (Rohan) joined room ${roomCode}`);

  // 3. 3rd player attempts to join (should fail with ROOM_FULL)
  const joinFailRes: any = await new Promise((res) => {
    clientC.emit('join_room', { roomCode, playerName: 'Imposter' }, res);
  });
  if (joinFailRes.success || joinFailRes.code !== 'ROOM_FULL') {
    throw new Error(`Expected ROOM_FULL error but got: ${JSON.stringify(joinFailRes)}`);
  }
  console.log('✓ 3rd Player properly rejected with ROOM_FULL');

  // 4. Test Game Mode Selection in Lobby
  // Non-host attempts to change mode -> should fail
  const nonHostModeRes: any = await new Promise((res) => {
    clientB.emit('set_game_mode', { roomId, sessionToken: tokenB, mode: 'WORDS_ONLY' }, res);
  });
  if (nonHostModeRes.success || nonHostModeRes.code !== 'NOT_AUTHORIZED') {
    throw new Error('Non-host was able to change game mode!');
  }
  console.log('✓ Non-host game mode change properly rejected with NOT_AUTHORIZED');

  // Host changes mode to WORDS_ONLY
  const hostWordsModeRes: any = await new Promise((res) => {
    clientA.emit('set_game_mode', { roomId, sessionToken: tokenA, mode: 'WORDS_ONLY' }, res);
  });
  if (!hostWordsModeRes.success) throw new Error('Host failed to set mode to WORDS_ONLY');
  await new Promise((r) => setTimeout(r, 50));
  if (stateA!.room.mode !== 'WORDS_ONLY' || stateB!.room.mode !== 'WORDS_ONLY') {
    throw new Error('WORDS_ONLY mode was not synced to both players');
  }
  // Verify board has 25 words
  const wordsBoardA = stateA!.me.board;
  if (wordsBoardA.length !== 5 || wordsBoardA[0].length !== 5 || !wordsBoardA[0][0].word) {
    throw new Error('WORDS_ONLY board did not generate 25 words');
  }
  console.log('✓ Host set mode to WORDS_ONLY, 25 words board generated and synced');

  // Host changes mode to NUMBERS_AND_WORDS
  const hostPairModeRes: any = await new Promise((res) => {
    clientA.emit('set_game_mode', { roomId, sessionToken: tokenA, mode: 'NUMBERS_AND_WORDS' }, res);
  });
  if (!hostPairModeRes.success) throw new Error('Host failed to set mode to NUMBERS_AND_WORDS');
  await new Promise((r) => setTimeout(r, 50));
  if (stateA!.room.mode !== 'NUMBERS_AND_WORDS' || stateB!.room.mode !== 'NUMBERS_AND_WORDS') {
    throw new Error('NUMBERS_AND_WORDS mode was not synced to both players');
  }
  const pairBoardA = stateA!.me.board;
  if (!pairBoardA[0][0].number || !pairBoardA[0][0].word) {
    throw new Error('NUMBERS_AND_WORDS board did not contain both number and word in tiles');
  }
  console.log('✓ Host set mode to NUMBERS_AND_WORDS, paired tiles generated and synced');

  // Host changes mode back to NUMBERS_ONLY for gameplay test
  await new Promise((res) => {
    clientA.emit('set_game_mode', { roomId, sessionToken: tokenA, mode: 'NUMBERS_ONLY' }, res);
  });
  await new Promise((r) => setTimeout(r, 50));
  console.log('✓ Host switched back to NUMBERS_ONLY mode');

  // 5. Verify 25 unique numbers, 0 marked cells, NO FREE space
  const boardA = stateA!.me.board;
  const boardB = stateB!.me.board;
  const markedA = stateA!.me.markedCells;
  const numbersInA = new Set<number>();
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (markedA[r][c] !== false) throw new Error(`Cell (${r},${c}) should start unmarked`);
      const num = boardA[r][c].number!;
      if (num < 1 || num > 25) throw new Error(`Numbers must be between 1 and 25, got ${num}`);
      numbersInA.add(num);
    }
  }
  if (numbersInA.size !== 25) throw new Error('Board A does not contain all 25 numbers 1..25');
  console.log('✓ Verified: 25 unique numbers 1–25, zero initial marks, NO FREE spaces (0/5 line progress)');

  // 6. Ready Up and Start Countdown
  await new Promise((res) => clientA.emit('set_ready', { roomId, sessionToken: tokenA, isReady: true }, res));
  await new Promise((res) => clientB.emit('set_ready', { roomId, sessionToken: tokenB, isReady: true }, res));
  console.log('✓ Both players marked READY');

  // Host starts countdown
  const hostStartRes: any = await new Promise((res) => {
    clientA.emit('start_countdown', { roomId, sessionToken: tokenA }, res);
  });
  if (!hostStartRes.success) throw new Error('Host failed to start countdown');
  console.log('✓ Host started countdown');

  // Wait for countdown to finish (3.6s)
  await new Promise((r) => setTimeout(r, 3600));

  if (stateA!.room.phase !== 'PLAYING' || stateB!.room.phase !== 'PLAYING') {
    throw new Error(`Expected PLAYING phase, got A: ${stateA!.room.phase}, B: ${stateB!.room.phase}`);
  }
  console.log('✓ Game transitioned to PLAYING phase');

  // Verify game mode cannot be changed during PLAYING
  const midGameModeChange: any = await new Promise((res) => {
    clientA.emit('set_game_mode', { roomId, sessionToken: tokenA, mode: 'WORDS_ONLY' }, res);
  });
  if (midGameModeChange.success || midGameModeChange.code !== 'INVALID_PHASE') {
    throw new Error('Game mode change should be locked once game starts');
  }
  console.log('✓ Game mode is locked during PLAYING phase');

  // 7. Verify Turn System & Fast Atomic Selection
  if (!stateA!.room.isMyTurn || stateB!.room.isMyTurn) {
    throw new Error('Host (Player A) should have the first turn');
  }
  console.log('✓ Player A has active turn');

  // Out of turn select by Player B -> rejected
  const outOfTurnSelect: any = await new Promise((res) => {
    clientB.emit('select_item', { roomId, sessionToken: tokenB, row: 0, col: 0, item: boardB[0][0] }, res);
  });
  if (outOfTurnSelect.success || outOfTurnSelect.code !== 'NOT_YOUR_TURN') {
    throw new Error('Out of turn selection was not rejected with NOT_YOUR_TURN');
  }
  console.log('✓ Out-of-turn selection rejected properly with NOT_YOUR_TURN');

  // 8. Player A makes an atomic selection
  const itemToSelectA = boardA[0][0];
  console.log(`  Player A selects tile (0,0): Number ${itemToSelectA.number}...`);

  const selectResA: any = await new Promise((res) => {
    clientA.emit('select_item', { roomId, sessionToken: tokenA, row: 0, col: 0, item: itemToSelectA }, res);
  });
  if (!selectResA.success) throw new Error(`Player A select failed: ${JSON.stringify(selectResA)}`);

  await new Promise((r) => setTimeout(r, 80));

  // Verify Player A's cell (0,0) is marked
  if (!stateA!.me.markedCells[0][0]) {
    throw new Error("Player A's selected cell was not marked!");
  }

  // In Numbers Only mode, all 25 numbers are on both boards -> so it MUST be marked on Player B's board too!
  let foundOnB = false;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (boardB[r][c].number === itemToSelectA.number) {
        if (stateB!.me.markedCells[r][c]) {
          foundOnB = true;
        }
      }
    }
  }
  if (!foundOnB) {
    throw new Error("Opponent's matching cell was not automatically marked!");
  }
  console.log('✓ Fast Turn: Player A cell marked AND opponent matching cell auto-marked immediately');

  // Turn should have automatically passed to Player B
  if (stateA!.room.isMyTurn || !stateB!.room.isMyTurn) {
    throw new Error('Turn did not automatically switch to Player B');
  }
  console.log('✓ Turn immediately switched to Player B');

  // 9. Test Simultaneous Bingo Resolution (Selecting player wins)
  console.log('  Testing Simultaneous Bingo: Selector priority rule...');
  const room = roomManager.findRoomById(roomId)!;
  const pA = room.players.find((p) => p.sessionToken === tokenA)!;
  const pB = room.players.find((p) => p.sessionToken === tokenB)!;

  // Let Player B have 4 marked in Row 1: (1,0), (1,1), (1,2), (1,3)
  pB.markedCells[1][0] = true;
  pB.markedCells[1][1] = true;
  pB.markedCells[1][2] = true;
  pB.markedCells[1][3] = true;
  pB.markedCells[1][4] = false;

  // Let Player A have 4 marked in Col 2: (0,2), (1,2), (2,2), (3,2)
  pA.markedCells[0][2] = true;
  pA.markedCells[1][2] = true;
  pA.markedCells[2][2] = true;
  pA.markedCells[3][2] = true;
  pA.markedCells[4][2] = false;

  // Align the 5th tile: B's row 1 col 4 will have the SAME number as A's row 4 col 2
  const sharedNum = pB.board[1][4].number!;
  // Swap A's board at (4,2) to match this shared number
  let oldR = -1, oldC = -1;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (pA.board[r][c].number === sharedNum) {
        oldR = r;
        oldC = c;
      }
    }
  }
  if (oldR !== -1) {
    const temp = pA.board[4][2];
    pA.board[4][2] = pA.board[oldR][oldC];
    pA.board[oldR][oldC] = temp;
  }

  // Now it's Player B's turn to select tile (1,4)
  room.activePlayerId = pB.id;
  roomManager.broadcastRoomUpdate(room);
  await new Promise((r) => setTimeout(r, 60));

  const simultaneousItem = pB.board[1][4];
  const simSelectRes: any = await new Promise((res) => {
    clientB.emit('select_item', { roomId, sessionToken: tokenB, row: 1, col: 4, item: simultaneousItem }, res);
  });

  if (!simSelectRes.success || !simSelectRes.isBingo) {
    throw new Error('Simultaneous Bingo move was not detected as Bingo');
  }

  await new Promise((r) => setTimeout(r, 80));

  // Verify Player B (the selector) is the WINNER
  if (stateA!.room.phase !== 'GAME_OVER' || stateA!.room.winner?.playerId !== pB.id) {
    throw new Error(`Expected Player B (the active selector) to win simultaneous Bingo, but winner was: ${stateA!.room.winner?.playerName}`);
  }
  console.log(`✓ Simultaneous Bingo verified: Selector ${pB.name} won immediately!`);

  // 10. Test Rejection of Actions After GAME_OVER
  const postGameOverSelect: any = await new Promise((res) => {
    clientA.emit('select_item', { roomId, sessionToken: tokenA, row: 2, col: 2, item: boardA[2][2] }, res);
  });
  if (postGameOverSelect.success || postGameOverSelect.code !== 'GAME_OVER') {
    throw new Error('Post game over selection was not rejected with GAME_OVER');
  }
  console.log('✓ Post-game over actions rejected with GAME_OVER code');

  // 11. Test Reconnection
  const clientAReconnect = await createClient();
  clientAReconnect.on('room_state_update', (s: ClientGameState) => { stateA = s; });

  const reconnectRes: any = await new Promise((res) => {
    clientAReconnect.emit('reconnect_player', { roomId, sessionToken: tokenA }, res);
  });
  if (!reconnectRes.success || !reconnectRes.state) {
    throw new Error('Reconnection failed');
  }
  stateA = reconnectRes.state;
  if (stateA.room.phase !== 'GAME_OVER' || stateA.room.mode !== 'NUMBERS_ONLY') {
    throw new Error('Reconnected state lost game phase or mode');
  }
  console.log('✓ Session Reconnection restored full authoritative state snapshot & mode');

  // 12. Test Rematch (Preserves mode, resets 25 cells to 0 marks, resets to Round 2)
  const rematchA: any = await new Promise((res) => {
    clientAReconnect.emit('request_rematch', { roomId, sessionToken: tokenA }, res);
  });
  if (!rematchA.success || rematchA.bothAgreed) throw new Error('Rematch should wait for Player B');

  const rematchB: any = await new Promise((res) => {
    clientB.emit('request_rematch', { roomId, sessionToken: tokenB }, res);
  });
  if (!rematchB.success || !rematchB.bothAgreed) throw new Error('Rematch failed when both agreed');

  await new Promise((r) => setTimeout(r, 100));

  if (stateA!.room.round !== 2 || stateA!.room.phase !== 'LOBBY' || stateA!.room.mode !== 'NUMBERS_ONLY') {
    throw new Error(`Expected Round 2, phase LOBBY, mode NUMBERS_ONLY. Got round ${stateA!.room.round}, phase ${stateA!.room.phase}, mode ${stateA!.room.mode}`);
  }

  // Verify all 25 cells reset to false
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (stateA!.me.markedCells[r][c] !== false || stateB!.me.markedCells[r][c] !== false) {
        throw new Error('Rematch did not reset markedCells to 0 marks');
      }
    }
  }
  console.log('✓ Rematch successfully started Round 2 in LOBBY with preserved mode and 0 marks');

  // 13. Teardown
  clientA.disconnect();
  clientB.disconnect();
  clientC.disconnect();
  clientAReconnect.disconnect();
  io.close();
  server.close();

  console.log('\n========================================================');
  console.log('🎉 ALL MULTI-MODE FAST BINGO E2E TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================\n');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});



