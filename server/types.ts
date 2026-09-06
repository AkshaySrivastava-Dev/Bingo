export type GamePhase =
  | 'WAITING_FOR_PLAYER'
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'GAME_OVER';

export interface BingoCellData {
  row: number;
  col: number;
  value: number; // 0 for FREE space
  isFree: boolean;
}

export type BingoBoard = number[][]; // 5x5 matrix
export type MarkedGrid = boolean[][]; // 5x5 boolean matrix

export interface WinningPattern {
  type: 'row' | 'col' | 'diagonal';
  index?: number; // row index (0-4) or col index (0-4)
  name: string; // e.g. "Row 3", "Column B", "Main Diagonal"
  coordinates: [number, number][]; // list of 5 coordinates [row, col]
}

export interface WinnerInfo {
  playerId: string;
  playerName: string;
  winningPattern: WinningPattern;
  winningNumbers: number[];
}

export interface PlayerState {
  id: string;
  sessionToken: string;
  socketId: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  board: BingoBoard;
  markedCells: MarkedGrid;
  bestLineCount: number; // 0-5
  completedLines: number;
  hasBingo: boolean;
  rematchRequested: boolean;
  lastActiveAt: number;
}

export interface PublicPlayerInfo {
  id: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  bestLineCount: number;
  completedLines: number;
  hasBingo: boolean;
  rematchRequested: boolean;
}

export interface RoomState {
  id: string;
  code: string;
  phase: GamePhase;
  players: PlayerState[];
  calledNumbers: number[];
  currentNumber: number | null;
  numberPool: number[];
  countdown: number; // in seconds
  winner: WinnerInfo | null;
  round: number;
  createdAt: number;
  lastActivityAt: number;
}

// Client View Model for authoritative synchronization
export interface ClientGameState {
  room: {
    id: string;
    code: string;
    phase: GamePhase;
    round: number;
    countdown: number;
    calledNumbers: number[];
    currentNumber: number | null;
    totalCalled: number;
    winner: WinnerInfo | null;
  };
  me: {
    id: string;
    sessionToken: string;
    name: string;
    avatarColor: string;
    isHost: boolean;
    isReady: boolean;
    isConnected: boolean;
    board: BingoBoard;
    markedCells: MarkedGrid;
    bestLineCount: number;
    completedLines: number;
    hasBingo: boolean;
    rematchRequested: boolean;
  };
  opponent: PublicPlayerInfo | null;
}

// Error codes
export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_ALREADY_STARTED'
  | 'NOT_AUTHORIZED'
  | 'INVALID_MOVE'
  | 'NUMBER_NOT_CALLED'
  | 'CELL_ALREADY_MARKED'
  | 'GAME_OVER'
  | 'INVALID_SESSION'
  | 'INVALID_NAME';

export interface ServerErrorResponse {
  code: ErrorCode;
  message: string;
}
