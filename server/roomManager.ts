import crypto from 'node:crypto';
import {
  GameMode,
  RoomState,
  PlayerState,
  ClientGameState,
  PublicPlayerInfo,
  WinnerInfo,
  MoveRecord,
  BingoItem,
} from './types.js';
import {
  generateBingoBoard,
  createInitialMarkedGrid,
  calculateProgress,
  checkBingo,
  getWinningItems,
  areItemsEqual,
  findItemOnBoard,
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

  public createRoom(
    hostName: string,
    socketId: string,
    mode: GameMode = 'NUMBERS_ONLY'
  ): { room: RoomState; player: PlayerState } {
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
      board: generateBingoBoard(mode),
      markedCells: createInitialMarkedGrid(),
      bestLineCount: 0,
      completedLines: 0,
      hasBingo: false,
      rematchRequested: false,
      lastActiveAt: Date.now(),
    };

    const room: RoomState = {
      id: roomId,
      code,
      mode,
      phase: 'WAITING_FOR_PLAYER',
      players: [hostPlayer],
      activePlayerId: null,
      lastMove: null,
      playHistory: [],
      allSelectedItems: [],
      countdown: 3,
      winner: null,
      round: 1,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    return { room, player: hostPlayer };
  }

  public setGameMode(
    roomId: string,
    sessionToken: string,
    mode: GameMode
  ): { success: boolean; room?: RoomState; errorCode?: string; errorMessage?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, errorCode: 'ROOM_NOT_FOUND', errorMessage: 'Room not found.' };
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player || !player.isHost) {
      return { success: false, errorCode: 'NOT_AUTHORIZED', errorMessage: 'Only the host can change game mode.' };
    }

    if (room.phase !== 'WAITING_FOR_PLAYER' && room.phase !== 'LOBBY') {
      return { success: false, errorCode: 'INVALID_PHASE', errorMessage: 'Game mode is locked once game starts.' };
    }

    if (mode !== 'NUMBERS_ONLY' && mode !== 'WORDS_ONLY' && mode !== 'NUMBERS_AND_WORDS') {
      return { success: false, errorCode: 'INVALID_MODE', errorMessage: 'Invalid game mode specified.' };
    }

    room.mode = mode;
    room.lastActivityAt = Date.now();

    // Regenerate distinct boards for players in the newly selected mode
    const generatedBoards: any[] = [];
    for (const p of room.players) {
      let b = generateBingoBoard(mode);
      while (generatedBoards.some((gb) => JSON.stringify(gb) === JSON.stringify(b))) {
        b = generateBingoBoard(mode);
      }
      generatedBoards.push(b);
      p.board = b;
      p.markedCells = createInitialMarkedGrid();
      p.bestLineCount = 0;
      p.completedLines = 0;
      p.hasBingo = false;
      p.isReady = false;
    }

    this.broadcastRoomUpdate(room);
    return { success: true, room };
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
    let newBoard = generateBingoBoard(room.mode);
    if (JSON.stringify(newBoard) === JSON.stringify(room.players[0].board)) {
      newBoard = generateBingoBoard(room.mode);
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
      bestLineCount: 0,
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
    room.lastMove = null;
    room.playHistory = [];
    room.allSelectedItems = [];
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
   * Fast Turn Action: Active player selects an unmarked item from their board.
   * Immediately marks selector's board, checks and auto-marks opponent if present,
   * checks 1-line Bingo for both, resolves simultaneous Bingo (selector wins),
   * and passes turn immediately.
   */
  public selectItem(
    roomId: string,
    sessionToken: string,
    row: number,
    col: number,
    item: BingoItem
  ): {
    success: boolean;
    isBingo?: boolean;
    winner?: WinnerInfo;
    nextPlayerId?: string;
    moveRecord?: MoveRecord;
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

    if (room.activePlayerId !== player.id) {
      return { success: false, errorCode: 'NOT_YOUR_TURN', errorMessage: 'It is not your turn to choose an item.' };
    }

    if (row < 0 || row > 4 || col < 0 || col > 4) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Cell coordinates out of bounds.' };
    }

    const cellItem = player.board[row][col];
    if (!areItemsEqual(cellItem, item, room.mode)) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Selected item does not match cell on your board.' };
    }

    if (player.markedCells[row][col]) {
      return { success: false, errorCode: 'CELL_ALREADY_MARKED', errorMessage: 'Cannot select an already marked cell.' };
    }

    if (room.allSelectedItems.some((si) => areItemsEqual(si, item, room.mode))) {
      return { success: false, errorCode: 'ITEM_ALREADY_SELECTED', errorMessage: 'This item was already selected earlier.' };
    }

    const opponent = room.players.find((p) => p.id !== player.id);
    if (!opponent) {
      return { success: false, errorCode: 'INVALID_MOVE', errorMessage: 'Waiting for opponent.' };
    }

    // Step 1 & 2: Mark selector's cell
    player.markedCells[row][col] = true;
    room.allSelectedItems.push(item);

    const selectorProgress = calculateProgress(player.markedCells);
    player.bestLineCount = selectorProgress.bestLineCount;
    player.completedLines = selectorProgress.completedLines;

    // Step 3 & 4: Check and auto-mark matching item on opponent board
    const opponentMatch = findItemOnBoard(opponent.board, item, room.mode);
    let hasMatch = false;
    let markedOnOpponent = false;

    if (opponentMatch && !opponent.markedCells[opponentMatch.row][opponentMatch.col]) {
      opponent.markedCells[opponentMatch.row][opponentMatch.col] = true;
      const opProg = calculateProgress(opponent.markedCells);
      opponent.bestLineCount = opProg.bestLineCount;
      opponent.completedLines = opProg.completedLines;
      hasMatch = true;
      markedOnOpponent = true;
    }

    // Step 5: Record move in history
    const moveRecord: MoveRecord = {
      item,
      selectedBy: player.id,
      selectedByName: player.name,
      hasMatch,
      markedOnOpponent,
      timestamp: Date.now(),
    };
    room.lastMove = moveRecord;
    room.playHistory.push(moveRecord);
    room.lastActivityAt = Date.now();

    // Step 6: Check Bingo for both players
    const selectorBingo = checkBingo(player.markedCells);
    const opponentBingo = checkBingo(opponent.markedCells);

    if (selectorBingo) {
      // Selector achieved Bingo! (If simultaneous, selector wins deterministically)
      player.hasBingo = true;
      room.phase = 'GAME_OVER';

      const winningItems = getWinningItems(player.board, selectorBingo);
      const winnerInfo: WinnerInfo = {
        playerId: player.id,
        playerName: player.name,
        winningPattern: selectorBingo,
        winningItems,
      };

      room.winner = winnerInfo;
      this.broadcastRoomUpdate(room);

      return {
        success: true,
        isBingo: true,
        winner: winnerInfo,
        moveRecord,
      };
    } else if (opponentBingo) {
      // Opponent achieved Bingo!
      opponent.hasBingo = true;
      room.phase = 'GAME_OVER';

      const winningItems = getWinningItems(opponent.board, opponentBingo);
      const winnerInfo: WinnerInfo = {
        playerId: opponent.id,
        playerName: opponent.name,
        winningPattern: opponentBingo,
        winningItems,
      };

      room.winner = winnerInfo;
      this.broadcastRoomUpdate(room);

      return {
        success: true,
        isBingo: true,
        winner: winnerInfo,
        moveRecord,
      };
    }

    // Step 7: No Bingo -> Pass turn immediately to opponent
    room.activePlayerId = opponent.id;
    this.broadcastRoomUpdate(room);

    return {
      success: true,
      isBingo: false,
      nextPlayerId: opponent.id,
      moveRecord,
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
    room.lastMove = null;
    room.playHistory = [];
    room.allSelectedItems = [];
    room.winner = null;
    room.round++;
    room.countdown = 3;
    room.lastActivityAt = Date.now();

    // Generate fresh distinct boards for the existing mode and reset marks
    const generatedBoards: any[] = [];
    for (const p of room.players) {
      let b = generateBingoBoard(room.mode);
      while (generatedBoards.some((gb) => JSON.stringify(gb) === JSON.stringify(b))) {
        b = generateBingoBoard(room.mode);
      }
      generatedBoards.push(b);
      p.board = b;
      p.markedCells = createInitialMarkedGrid();
      p.bestLineCount = 0;
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
      room.lastMove = null;
      room.playHistory = [];
      room.allSelectedItems = [];
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

    const isMyTurn = room.phase === 'PLAYING' && room.activePlayerId === me.id;

    return {
      room: {
        id: room.id,
        code: room.code,
        mode: room.mode,
        phase: room.phase,
        round: room.round,
        countdown: room.countdown,
        activePlayerId: room.activePlayerId,
        lastMove: room.lastMove,
        playHistory: room.playHistory,
        allSelectedItems: room.allSelectedItems,
        isMyTurn,
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


