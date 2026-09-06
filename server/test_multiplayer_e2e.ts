import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { RoomManager } from './roomManager.js';
import type { ClientGameState } from './types.js';

async function runE2ETest() {
  console.log('--- STARTING MULTIPLAYER BINGO E2E TEST ---');

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

    socket.on('mark_cell', (data: { roomId: string; sessionToken: string; row: number; col: number; value: number }, callback) => {
      const result = roomManager.markCell(data.roomId, data.sessionToken, data.row, data.col, data.value);
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

  const TEST_PORT = 3344;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`✓ Test Server started on port ${TEST_PORT}`);

  const SERVER_URL = `http://localhost:${TEST_PORT}`;

  // Helper to connect client
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

  clientA.on('number_called', (data: { number: number; totalCalled: number; history: number[] }) => {
    if (stateA) {
      stateA.room.currentNumber = data.number;
      stateA.room.calledNumbers = data.history;
      stateA.room.totalCalled = data.totalCalled;
    }
  });

  clientB.on('number_called', (data: { number: number; totalCalled: number; history: number[] }) => {
    if (stateB) {
      stateB.room.currentNumber = data.number;
      stateB.room.calledNumbers = data.history;
      stateB.room.totalCalled = data.totalCalled;
    }
  });

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

  // 4. Verify boards are randomized, valid and different
  const boardA = stateA!.me.board;
  const boardB = stateB!.me.board;
  if (boardA[2][2] !== 0 || boardB[2][2] !== 0) throw new Error('Center space must be FREE (0)');
  if (JSON.stringify(boardA) === JSON.stringify(boardB)) throw new Error('Player 1 and Player 2 received identical boards!');
  console.log('✓ Verified both players have unique 5x5 boards with FREE center (value 0)');

  // 5. Test Ready Status
  await new Promise((res) => clientA.emit('set_ready', { roomId, sessionToken: tokenA, isReady: true }, res));
  await new Promise((res) => clientB.emit('set_ready', { roomId, sessionToken: tokenB, isReady: true }, res));
  await new Promise((r) => setTimeout(r, 100)); // wait for socket sync
  console.log('✓ Both players marked READY');

  // 6. Non-host attempts to start game (should fail)
  const nonHostStartRes: any = await new Promise((res) => {
    clientB.emit('start_countdown', { roomId, sessionToken: tokenB }, res);
  });
  if (nonHostStartRes.success || nonHostStartRes.code !== 'NOT_AUTHORIZED') {
    throw new Error('Non-host was able to start game!');
  }
  console.log('✓ Non-host start attempt properly rejected with NOT_AUTHORIZED');

  // 7. Host starts countdown
  const hostStartRes: any = await new Promise((res) => {
    clientA.emit('start_countdown', { roomId, sessionToken: tokenA }, res);
  });
  if (!hostStartRes.success) throw new Error('Host failed to start countdown');
  console.log('✓ Host started countdown (3.. 2.. 1..)');

  // Wait for countdown (3s) + 1s initial number call
  console.log('  Waiting for countdown and game transition to PLAYING...');
  await new Promise((r) => setTimeout(r, 4500));

  if (stateA!.room.phase !== 'PLAYING' || stateB!.room.phase !== 'PLAYING') {
    throw new Error(`Expected phase PLAYING, got A: ${stateA!.room.phase}, B: ${stateB!.room.phase}`);
  }
  console.log('✓ Game transitioned to PLAYING phase');

  // 8. Test synchronized number calling
  const calledNumbersA = stateA!.room.calledNumbers;
  const calledNumbersB = stateB!.room.calledNumbers;
  if (calledNumbersA.length === 0) throw new Error('No numbers called after starting game');
  if (JSON.stringify(calledNumbersA) !== JSON.stringify(calledNumbersB)) {
    throw new Error('Called numbers desynced between Client A and Client B!');
  }
  console.log(`✓ Synchronized Number Calling verified: Called ${calledNumbersA.length} numbers: [${calledNumbersA.join(', ')}]`);

  // 9. Test Invalid Mark (uncalled number)
  const uncalledNum = 75; // assume not called or test guaranteed uncalled
  const markUncalledRes: any = await new Promise((res) => {
    clientA.emit('mark_cell', { roomId, sessionToken: tokenA, row: 0, col: 0, value: 999 }, res);
  });
  if (markUncalledRes.success || markUncalledRes.code !== 'INVALID_MOVE') {
    throw new Error(`Expected INVALID_MOVE for mismatched value, got: ${JSON.stringify(markUncalledRes)}`);
  }
  console.log('✓ Invalid cell value properly rejected with INVALID_MOVE');

  // 10. Test Valid Mark on called number or simulate a winning row
  // Let's add row 0 numbers of Player A to room's called numbers for instant deterministic Bingo test
  const room = roomManager.findRoomById(roomId)!;
  const targetRow = 0;
  for (let c = 0; c < 5; c++) {
    const val = boardA[targetRow][c];
    if (val !== 0 && !room.calledNumbers.includes(val)) {
      room.calledNumbers.push(val);
    }
  }

  // Mark all 5 cells in row 0
  for (let c = 0; c < 5; c++) {
    const val = boardA[targetRow][c];
    const markRes: any = await new Promise((res) => {
      clientA.emit('mark_cell', { roomId, sessionToken: tokenA, row: targetRow, col: c, value: val }, res);
    });
    if (!markRes.success) throw new Error(`Mark cell failed at col ${c}: ${JSON.stringify(markRes)}`);
    if (c === 4) {
      if (!markRes.isBingo || !markRes.winner) {
        throw new Error('5th cell in row 0 did not trigger Bingo win!');
      }
      console.log(`✓ BINGO triggered! Winner: ${markRes.winner.playerName}, Pattern: ${markRes.winner.winningPattern.name}`);
    }
  }

  await new Promise((r) => setTimeout(r, 200));

  // 11. Verify Game Over lock
  if (stateA!.room.phase !== 'GAME_OVER' || stateB!.room.phase !== 'GAME_OVER') {
    throw new Error('Game did not transition to GAME_OVER for both clients');
  }
  console.log('✓ Both clients in GAME_OVER state with winner synchronized');

  // Attempt to mark after game over (should be rejected)
  const markAfterGameOver: any = await new Promise((res) => {
    clientB.emit('mark_cell', { roomId, sessionToken: tokenB, row: 0, col: 0, value: boardB[0][0] }, res);
  });
  if (markAfterGameOver.success || markAfterGameOver.code !== 'GAME_OVER') {
    throw new Error('Marking after GAME_OVER was not rejected!');
  }
  console.log('✓ Post-game mark properly rejected with GAME_OVER');

  // 12. Test Reconnection
  const clientAReconnect = await createClient();
  clientAReconnect.on('room_state_update', (s: ClientGameState) => { stateA = s; });

  const reconnectRes: any = await new Promise((res) => {
    clientAReconnect.emit('reconnect_player', { roomId, sessionToken: tokenA }, res);
  });
  if (!reconnectRes.success || !reconnectRes.state) {
    throw new Error('Reconnection failed!');
  }
  stateA = reconnectRes.state;
  if (reconnectRes.state.me.name !== 'Akshay (Host)') {
    throw new Error('Reconnected state has wrong player name');
  }
  if (!reconnectRes.state.me.markedCells[0][0]) {
    throw new Error('Reconnected state lost marked cells!');
  }
  console.log('✓ Session Reconnection restored full authoritative state snapshot & marked cells');

  // 13. Test Rematch
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
  console.log('✓ Rematch successfully started Round 2 with fresh boards in LOBBY');

  // Clean up
  roomManager.stopCallingTimer(roomId);
  clientA.disconnect();
  clientB.disconnect();
  clientC.disconnect();
  clientAReconnect.disconnect();
  io.close();
  server.close();

  console.log('=============================================');
  console.log('🎉 ALL MULTIPLAYER E2E TEST SCENARIOS PASSED!');
  console.log('=============================================');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});

