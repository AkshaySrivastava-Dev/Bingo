import crypto from 'node:crypto';
import {
  GamePhase,
  RoomState,
  PlayerState,
  ClientGameState,
  PublicPlayerInfo,
  WinnerInfo,
  MoveRecord,
  PendingNumber,
} from './types.js';
import {
  generateBingoBoard,
  createInitialMarkedGrid,
  calculateProgress,
  checkBingo,
  getWinningNumbers,
  getNumberLetter,
  findNumberOnBoard,
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
      activePlayerId: null,
      turnState: 'SELECTING',
      pendingNumber: null,
      lastSelectedNumber: null,
      playHistory: [],
      allSelectedNumbers: [],
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
    const hostPlayer = room.players.find((p) => p.isHost) || room.players[0];
    room.activePlayerId = hostPlayer.id; // Host gets the first turn to choose
    room.turnState = 'SELECTING';
    room.pendingNumber = null;
    room.lastSelectedNumber = null;
    room.playHistory = [];
    room.allSelectedNumbers = [];
    room.winner = null;
    room.lastActivityAt = Date.now();

    this.broadcastRoomUpdate(room);
  }

  public stopCallingTimer(roomId: string): void {
    if (this.countdownTimers.has(roomId)) {
      clearInterval(this.countdownTimers.get(roomId)!);
      this.countdownTimers.delete(roomId);
    }
  }

  /**
   * Action 1: Active player selects an unmarked number from their own board.
   */
  public selectNumber(
    roomId: string,
    sessionToken: string,
    row: number,
    col: number,
    value: number
  ): {
    success: boolean;
    hasMatch?: boolean;
    pendingNumber?: PendingNumber | null;
    nextPlayerId?: string;
    errorCode?: string;
    errorMessage?: string;
  } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, errorCode: 'ROOM_NOT_FOUND', errorMessage: 'Room not found.' };
    }

    if (room.phase !== 'PLAYING') {
      return { success: false, errorCode: 'GAME_OVER', errorMessage: 'Game is not in PLAYING phase.' };
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      return { success: false, errorCode: 'INVALID_SESSION', errorMessage: 'Invalid player session.' };
    }

    if (room.turnState !== 'SELECTING' || room.activePlayerId !== player.id) {
      return { success: false, errorCode: 'NOT_YOUR_TURN', errorMessage: 'It is not your turn to choose a number.' };
    }

    if (row < 0 || row > 4 || col < 0 || col > 4) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Cell coordinates out of bounds.' };
    }

    if (player.board[row][col] !== value) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Cell value does not match board.' };
    }

    if (value === 0) {
      return { success: false, errorCode: 'INVALID_SELECTION', errorMessage: 'Cannot select the FREE space.' };
    }

    if (player.markedCells[row][col]) {
      return { success: false, errorCode: 'CELL_ALREADY_MARKED', errorMessage: 'Cannot select an already marked number.' };
    }

    if (room.allSelectedNumbers.includes(value)) {
      return { success: false, errorCode: 'NUMBER_ALREADY_SELECTED', errorMessage: 'This number was already chosen earlier.' };
    }

    const opponent = room.players.find((p) => p.id !== player.id);
    if (!opponent) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Waiting for opponent.' };
    }

    // Add to selected numbers tracker
    room.allSelectedNumbers.push(value);
    const letter = getNumberLetter(value);

    // Check if opponent has this number on their board
    const opponentMatch = findNumberOnBoard(opponent.board, value);
    const hasMatch = opponentMatch !== null && !opponent.markedCells[opponentMatch.row][opponentMatch.col];

    room.lastSelectedNumber = {
      number: value,
      letter,
      selectedBy: player.id,
      selectedByName: player.name,
    };
    room.lastActivityAt = Date.now();

    if (hasMatch) {
      // Opponent HAS the number -> Must respond and mark it
      const pending: PendingNumber = {
        number: value,
        letter,
        selectedBy: player.id,
        selectedByName: player.name,
        responderId: opponent.id,
      };
      room.pendingNumber = pending;
      room.turnState = 'WAITING_FOR_RESPONSE';

      this.broadcastRoomUpdate(room);

      return {
        success: true,
        hasMatch: true,
        pendingNumber: pending,
      };
    } else {
      // Opponent DOES NOT HAVE the number -> Record move as No Match & Pass turn to opponent directly
      const moveRecord: MoveRecord = {
        number: value,
        letter,
        selectedBy: player.id,
        selectedByName: player.name,
        hasMatch: false,
        markedByOpponent: false,
        timestamp: Date.now(),
      };
      room.playHistory.push(moveRecord);

      room.pendingNumber = null;
      room.activePlayerId = opponent.id;
      room.turnState = 'SELECTING';

      this.broadcastRoomUpdate(room);

      return {
        success: true,
        hasMatch: false,
        nextPlayerId: opponent.id,
      };
    }
  }

  /**
   * Action 2: Opponent responds to the pending selection by marking the matching number on their board.
   */
  public markSelectedNumber(
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
      return { success: false, errorCode: 'GAME_OVER', errorMessage: 'Game is not in PLAYING phase.' };
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      return { success: false, errorCode: 'INVALID_SESSION', errorMessage: 'Invalid player session.' };
    }

    if (room.turnState !== 'WAITING_FOR_RESPONSE' || !room.pendingNumber) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'No pending number to respond to.' };
    }

    if (room.pendingNumber.responderId !== player.id) {
      return { success: false, errorCode: 'NOT_PENDING_RESPONDER', errorMessage: 'Only the opponent can mark the selected number.' };
    }

    if (row < 0 || row > 4 || col < 0 || col > 4) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Cell coordinates out of bounds.' };
    }

    if (player.board[row][col] !== value || value !== room.pendingNumber.number) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'You can only mark the exact number selected by your opponent.' };
    }

    if (player.markedCells[row][col]) {
      return { success: false, errorCode: 'CELL_ALREADY_MARKED', errorMessage: 'This cell is already marked.' };
    }

    // Mark responder's cell
    player.markedCells[row][col] = true;
    player.lastActiveAt = Date.now();
    room.lastActivityAt = Date.now();

    // Recalculate progress
    const { bestLineCount, completedLines } = calculateProgress(player.markedCells);
    player.bestLineCount = bestLineCount;
    player.completedLines = completedLines;

    // Record completed move in history
    const moveRecord: MoveRecord = {
      number: room.pendingNumber.number,
      letter: room.pendingNumber.letter,
      selectedBy: room.pendingNumber.selectedBy,
      selectedByName: room.pendingNumber.selectedByName,
      hasMatch: true,
      markedByOpponent: true,
      timestamp: Date.now(),
    };
    room.playHistory.push(moveRecord);

    // Check for 1-line Bingo on responder's board
    const winningPattern = checkBingo(player.markedCells);

    if (winningPattern && !room.winner) {
      // Responder achieved BINGO!
      player.hasBingo = true;
      room.phase = 'GAME_OVER';
      room.pendingNumber = null;

      const winningNumbers = getWinningNumbers(player.board, winningPattern);
      const winnerInfo: WinnerInfo = {
        playerId: player.id,
        playerName: player.name,
        winningPattern,
        winningNumbers,
      };

      room.winner = winnerInfo;
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

    // If no Bingo, turn now passes to the responder to SELECT their number
    room.activePlayerId = player.id;
    room.turnState = 'SELECTING';
    room.pendingNumber = null;

    this.broadcastRoomUpdate(room);

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
    room.activePlayerId = null;
    room.turnState = 'SELECTING';
    room.pendingNumber = null;
    room.lastSelectedNumber = null;
    room.playHistory = [];
    room.allSelectedNumbers = [];
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
      room.activePlayerId = null;
      room.pendingNumber = null;
      room.lastSelectedNumber = null;
      room.playHistory = [];
      room.allSelectedNumbers = [];
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

    const isMyTurn = room.phase === 'PLAYING' && room.activePlayerId === me.id && room.turnState === 'SELECTING';
    const isPendingResponder = room.phase === 'PLAYING' && room.turnState === 'WAITING_FOR_RESPONSE' && room.pendingNumber?.responderId === me.id;

    return {
      room: {
        id: room.id,
        code: room.code,
        phase: room.phase,
        round: room.round,
        countdown: room.countdown,
        activePlayerId: room.activePlayerId,
        turnState: room.turnState,
        pendingNumber: room.pendingNumber,
        lastSelectedNumber: room.lastSelectedNumber,
        playHistory: room.playHistory,
        allSelectedNumbers: room.allSelectedNumbers,
        isMyTurn,
        isPendingResponder,
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

