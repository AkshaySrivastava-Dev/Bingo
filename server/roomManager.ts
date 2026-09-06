import crypto from 'node:crypto';
import {
  GamePhase,
  RoomState,
  PlayerState,
  ClientGameState,
  PublicPlayerInfo,
  WinnerInfo,
  WinningPattern,
} from './types.js';
import {
  generateBingoBoard,
  createInitialMarkedGrid,
  shuffleNumberPool,
  calculateProgress,
  checkBingo,
  getWinningNumbers,
} from './gameEngine.js';
import { Server } from 'socket.io';

const AVATAR_COLORS = [
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-indigo-600',
  'from-violet-500 to-fuchsia-600',
];

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private countdownTimers: Map<string, NodeJS.Timeout> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;

    // Periodic cleanup of stale rooms (inactive for > 2 hours)
    setInterval(() => {
      this.cleanupStaleRooms();
    }, 5 * 60 * 1000);
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars 0/O, 1/I
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.findRoomByCode(code));
    return code;
  }

  public findRoomById(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  public findRoomByCode(code: string): RoomState | undefined {
    const upper = code.trim().toUpperCase();
    for (const room of this.rooms.values()) {
      if (room.code === upper) {
        return room;
      }
    }
    return undefined;
  }

  public createRoom(hostName: string, socketId: string): { room: RoomState; player: PlayerState } {
    const roomId = crypto.randomUUID();
    const code = this.generateRoomCode();
    const sessionToken = crypto.randomUUID();
    const playerId = crypto.randomUUID();

    const hostPlayer: PlayerState = {
      id: playerId,
      sessionToken,
      socketId,
      name: hostName.trim() || 'Host Player',
      avatarColor: AVATAR_COLORS[0],
      isHost: true,
      isReady: false,
      isConnected: true,
      board: generateBingoBoard(),
      markedCells: createInitialMarkedGrid(),
      bestLineCount: 1, // center FREE is already marked
      completedLines: 0,
      hasBingo: false,
      rematchRequested: false,
      lastActiveAt: Date.now(),
    };

    const room: RoomState = {
      id: roomId,
      code,
      phase: 'WAITING_FOR_PLAYER',
      players: [hostPlayer],
      calledNumbers: [],
      currentNumber: null,
      numberPool: shuffleNumberPool(),
      countdown: 3,
      winner: null,
      round: 1,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    return { room, player: hostPlayer };
  }

  public joinRoom(
    roomCode: string,
    playerName: string,
    socketId: string
  ): { success: boolean; room?: RoomState; player?: PlayerState; errorCode?: string; errorMessage?: string } {
    const room = this.findRoomByCode(roomCode);
    if (!room) {
      return { success: false, errorCode: 'ROOM_NOT_FOUND', errorMessage: 'Game room not found. Check the room code.' };
    }

    if (room.players.length >= 2) {
      return { success: false, errorCode: 'ROOM_FULL', errorMessage: 'This game room is already full (2 players max).' };
    }

    if (room.phase === 'PLAYING' || room.phase === 'COUNTDOWN') {
      return { success: false, errorCode: 'GAME_ALREADY_STARTED', errorMessage: 'This game has already started.' };
    }

    const playerId = crypto.randomUUID();
    const sessionToken = crypto.randomUUID();
    const colorIndex = room.players.length % AVATAR_COLORS.length === 0 ? 1 : (room.players.length % AVATAR_COLORS.length);

    // Make sure player 2 gets a unique board different from player 1
    let newBoard = generateBingoBoard();
    if (JSON.stringify(newBoard) === JSON.stringify(room.players[0].board)) {
      newBoard = generateBingoBoard();
    }

    const newPlayer: PlayerState = {
      id: playerId,
      sessionToken,
      socketId,
      name: playerName.trim() || 'Player 2',
      avatarColor: AVATAR_COLORS[1] || AVATAR_COLORS[colorIndex],
      isHost: false,
      isReady: false,
      isConnected: true,
      board: newBoard,
      markedCells: createInitialMarkedGrid(),
      bestLineCount: 1,
      completedLines: 0,
      hasBingo: false,
      rematchRequested: false,
      lastActiveAt: Date.now(),
    };

    room.players.push(newPlayer);
    room.phase = 'LOBBY';
    room.lastActivityAt = Date.now();

    return { success: true, room, player: newPlayer };
  }

  public reconnectPlayer(
    roomId: string,
    sessionToken: string,
    socketId: string
  ): { success: boolean; room?: RoomState; player?: PlayerState; errorCode?: string; errorMessage?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, errorCode: 'ROOM_NOT_FOUND', errorMessage: 'Room does not exist or has expired.' };
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      return { success: false, errorCode: 'INVALID_SESSION', errorMessage: 'Session token is invalid or expired.' };
    }

    player.socketId = socketId;
    player.isConnected = true;
    player.lastActiveAt = Date.now();
    room.lastActivityAt = Date.now();

    return { success: true, room, player };
  }

  public setPlayerReady(
    roomId: string,
    sessionToken: string,
    isReady: boolean
  ): { success: boolean; room?: RoomState; errorCode?: string; errorMessage?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, errorCode: 'ROOM_NOT_FOUND', errorMessage: 'Room not found.' };
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      return { success: false, errorCode: 'INVALID_SESSION', errorMessage: 'Player not found.' };
    }

    player.isReady = isReady;
    player.lastActiveAt = Date.now();
    room.lastActivityAt = Date.now();

    return { success: true, room };
  }

  public startCountdown(
    roomId: string,
    sessionToken: string
  ): { success: boolean; room?: RoomState; errorCode?: string; errorMessage?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, errorCode: 'ROOM_NOT_FOUND', errorMessage: 'Room not found.' };
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player || !player.isHost) {
      return { success: false, errorCode: 'NOT_AUTHORIZED', errorMessage: 'Only the host can start the game.' };
    }

    if (room.players.length < 2) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Waiting for another player to join.' };
    }

    if (!room.players.every((p) => p.isReady)) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Both players must be Ready before starting.' };
    }

    room.phase = 'COUNTDOWN';
    room.countdown = 3;
    room.lastActivityAt = Date.now();

    // Broadcast countdown ticks
    this.broadcastRoomUpdate(room);

    if (this.countdownTimers.has(roomId)) {
      clearInterval(this.countdownTimers.get(roomId)!);
    }

    const countdownInterval = setInterval(() => {
      room.countdown--;
      room.lastActivityAt = Date.now();

      if (room.countdown > 0) {
        this.io.to(room.id).emit('countdown_tick', { countdown: room.countdown });
      } else {
        clearInterval(countdownInterval);
        this.countdownTimers.delete(roomId);
        this.startGame(roomId);
      }
    }, 1000);

    this.countdownTimers.set(roomId, countdownInterval);

    return { success: true, room };
  }

  public startGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.phase = 'PLAYING';
    room.numberPool = shuffleNumberPool();
    room.calledNumbers = [];
    room.currentNumber = null;
    room.winner = null;
    room.lastActivityAt = Date.now();

    this.broadcastRoomUpdate(room);

    // Call first number after a short 1 second delay
    setTimeout(() => {
      this.callNextNumber(roomId);
    }, 1000);

    // Set recurring 4-second automatic call timer
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!);
    }

    const callInterval = setInterval(() => {
      this.callNextNumber(roomId);
    }, 4000);

    this.timers.set(roomId, callInterval);
  }

  private callNextNumber(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'PLAYING') {
      if (this.timers.has(roomId)) {
        clearInterval(this.timers.get(roomId)!);
        this.timers.delete(roomId);
      }
      return;
    }

    if (room.numberPool.length === 0) {
      // All numbers called
      this.stopCallingTimer(roomId);
      return;
    }

    const nextNumber = room.numberPool.pop()!;
    room.calledNumbers.push(nextNumber);
    room.currentNumber = nextNumber;
    room.lastActivityAt = Date.now();

    this.io.to(roomId).emit('number_called', {
      number: nextNumber,
      totalCalled: room.calledNumbers.length,
      history: room.calledNumbers,
    });
  }

  public stopCallingTimer(roomId: string): void {
    if (this.timers.has(roomId)) {
      clearInterval(this.timers.get(roomId)!);
      this.timers.delete(roomId);
    }
    if (this.countdownTimers.has(roomId)) {
      clearInterval(this.countdownTimers.get(roomId)!);
      this.countdownTimers.delete(roomId);
    }
  }

  public markCell(
    roomId: string,
    sessionToken: string,
    row: number,
    col: number,
    value: number
  ): {
    success: boolean;
    isBingo?: boolean;
    winner?: WinnerInfo;
    markedCells?: boolean[][];
    bestLineCount?: number;
    completedLines?: number;
    errorCode?: string;
    errorMessage?: string;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, errorCode: 'ROOM_NOT_FOUND', errorMessage: 'Room not found.' };
    }

    if (room.phase !== 'PLAYING') {
      return { success: false, errorCode: 'GAME_OVER', errorMessage: 'Cannot mark cell: Game is not in PLAYING phase.' };
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      return { success: false, errorCode: 'INVALID_SESSION', errorMessage: 'Invalid player session.' };
    }

    if (row < 0 || row > 4 || col < 0 || col > 4) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Cell coordinate out of bounds.' };
    }

    if (player.board[row][col] !== value) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Cell value does not match board.' };
    }

    if (player.markedCells[row][col]) {
      return { success: false, errorCode: 'CELL_ALREADY_MARKED', errorMessage: 'This cell is already marked.' };
    }

    // Value must be 0 (FREE) or in calledNumbers
    if (value !== 0 && !room.calledNumbers.includes(value)) {
      return { success: false, errorCode: 'NUMBER_NOT_CALLED', errorMessage: 'This number has not been called yet.' };
    }

    // Mark cell
    player.markedCells[row][col] = true;
    player.lastActiveAt = Date.now();
    room.lastActivityAt = Date.now();

    // Recalculate progress
    const { bestLineCount, completedLines } = calculateProgress(player.markedCells);
    player.bestLineCount = bestLineCount;
    player.completedLines = completedLines;

    // Check for Bingo win
    const winningPattern = checkBingo(player.markedCells);

    if (winningPattern && !room.winner) {
      // We have a winner!
      player.hasBingo = true;
      room.phase = 'GAME_OVER';

      const winningNumbers = getWinningNumbers(player.board, winningPattern);
      const winnerInfo: WinnerInfo = {
        playerId: player.id,
        playerName: player.name,
        winningPattern,
        winningNumbers,
      };

      room.winner = winnerInfo;
      this.stopCallingTimer(roomId);

      // Broadcast game_over to all players
      this.broadcastRoomUpdate(room);

      return {
        success: true,
        isBingo: true,
        winner: winnerInfo,
        markedCells: player.markedCells,
        bestLineCount: player.bestLineCount,
        completedLines: player.completedLines,
      };
    }

    // Broadcast updated progress to other players in the room
    this.broadcastProgressUpdate(room, player);

    return {
      success: true,
      isBingo: false,
      markedCells: player.markedCells,
      bestLineCount: player.bestLineCount,
      completedLines: player.completedLines,
    };
  }

  public requestRematch(
    roomId: string,
    sessionToken: string
  ): { success: boolean; room?: RoomState; bothAgreed?: boolean; errorCode?: string; errorMessage?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, errorCode: 'ROOM_NOT_FOUND', errorMessage: 'Room not found.' };
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      return { success: false, errorCode: 'INVALID_SESSION', errorMessage: 'Invalid player session.' };
    }

    player.rematchRequested = true;
    player.lastActiveAt = Date.now();
    room.lastActivityAt = Date.now();

    // Check if both players requested rematch
    const bothAgreed = room.players.length === 2 && room.players.every((p) => p.rematchRequested);

    if (bothAgreed) {
      this.resetForNewRound(room);
      this.broadcastRoomUpdate(room);
      return { success: true, room, bothAgreed: true };
    }

    this.broadcastRoomUpdate(room);
    return { success: true, room, bothAgreed: false };
  }

  private resetForNewRound(room: RoomState): void {
    this.stopCallingTimer(room.id);

    room.phase = 'LOBBY';
    room.calledNumbers = [];
    room.currentNumber = null;
    room.numberPool = shuffleNumberPool();
    room.winner = null;
    room.round++;
    room.countdown = 3;
    room.lastActivityAt = Date.now();

    // Generate fresh distinct boards and reset marks for all players
    const generatedBoards: number[][][] = [];
    for (const p of room.players) {
      let b = generateBingoBoard();
      while (generatedBoards.some((gb) => JSON.stringify(gb) === JSON.stringify(b))) {
        b = generateBingoBoard();
      }
      generatedBoards.push(b);
      p.board = b;
      p.markedCells = createInitialMarkedGrid();
      p.bestLineCount = 1;
      p.completedLines = 0;
      p.hasBingo = false;
      p.isReady = false;
      p.rematchRequested = false;
    }
  }

  public handleDisconnect(socketId: string): void {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.isConnected = false;
        player.lastActiveAt = Date.now();
        room.lastActivityAt = Date.now();

        // Notify room
        this.io.to(room.id).emit('player_status_change', {
          playerId: player.id,
          name: player.name,
          isConnected: false,
        });

        break;
      }
    }
  }

  public leaveRoom(
    roomId: string,
    sessionToken: string
  ): { success: boolean; roomLeft?: boolean; errorCode?: string; errorMessage?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: true, roomLeft: true };

    const playerIndex = room.players.findIndex((p) => p.sessionToken === sessionToken);
    if (playerIndex === -1) return { success: true, roomLeft: true };

    const leavingPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    if (room.players.length === 0) {
      this.stopCallingTimer(roomId);
      this.rooms.delete(roomId);
      return { success: true, roomLeft: true };
    }

    // If leaving player was host, transfer host to remaining player
    if (leavingPlayer.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    // If game was playing or in lobby, reset to WAITING_FOR_PLAYER
    if (room.phase === 'PLAYING' || room.phase === 'COUNTDOWN') {
      this.stopCallingTimer(roomId);
      room.phase = 'WAITING_FOR_PLAYER';
      room.winner = null;
      room.calledNumbers = [];
      room.currentNumber = null;
    } else if (room.phase === 'LOBBY') {
      room.phase = 'WAITING_FOR_PLAYER';
    }

    this.broadcastRoomUpdate(room);
    return { success: true, roomLeft: true };
  }

  public getClientState(room: RoomState, sessionToken: string): ClientGameState | null {
    const me = room.players.find((p) => p.sessionToken === sessionToken);
    if (!me) return null;

    const opponentPlayer = room.players.find((p) => p.sessionToken !== sessionToken);
    const opponent: PublicPlayerInfo | null = opponentPlayer
      ? {
          id: opponentPlayer.id,
          name: opponentPlayer.name,
          avatarColor: opponentPlayer.avatarColor,
          isHost: opponentPlayer.isHost,
          isReady: opponentPlayer.isReady,
          isConnected: opponentPlayer.isConnected,
          bestLineCount: opponentPlayer.bestLineCount,
          completedLines: opponentPlayer.completedLines,
          hasBingo: opponentPlayer.hasBingo,
          rematchRequested: opponentPlayer.rematchRequested,
        }
      : null;

    return {
      room: {
        id: room.id,
        code: room.code,
        phase: room.phase,
        round: room.round,
        countdown: room.countdown,
        calledNumbers: room.calledNumbers,
        currentNumber: room.currentNumber,
        totalCalled: room.calledNumbers.length,
        winner: room.winner,
      },
      me: {
        id: me.id,
        sessionToken: me.sessionToken,
        name: me.name,
        avatarColor: me.avatarColor,
        isHost: me.isHost,
        isReady: me.isReady,
        isConnected: me.isConnected,
        board: me.board,
        markedCells: me.markedCells,
        bestLineCount: me.bestLineCount,
        completedLines: me.completedLines,
        hasBingo: me.hasBingo,
        rematchRequested: me.rematchRequested,
      },
      opponent,
    };
  }

  public broadcastRoomUpdate(room: RoomState): void {
    for (const player of room.players) {
      if (player.isConnected && player.socketId) {
        const clientState = this.getClientState(room, player.sessionToken);
        if (clientState) {
          this.io.to(player.socketId).emit('room_state_update', clientState);
        }
      }
    }
  }

  public broadcastProgressUpdate(room: RoomState, updatedPlayer: PlayerState): void {
    for (const player of room.players) {
      if (player.sessionToken !== updatedPlayer.sessionToken && player.socketId) {
        this.io.to(player.socketId).emit('opponent_progress_update', {
          bestLineCount: updatedPlayer.bestLineCount,
          completedLines: updatedPlayer.completedLines,
        });
      }
    }
  }

  private cleanupStaleRooms(): void {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, room] of this.rooms.entries()) {
      if (room.lastActivityAt < twoHoursAgo) {
        this.stopCallingTimer(id);
        this.rooms.delete(id);
      }
    }
  }
}
