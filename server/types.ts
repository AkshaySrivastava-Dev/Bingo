export type GameMode = 'NUMBERS_ONLY' | 'NUMBERS_AND_WORDS' | 'WORDS_ONLY';

export type GamePhase =
  | 'WAITING_FOR_PLAYER'
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'GAME_OVER';

export interface BingoItem {
  id: string; // e.g. "num_7", "word_APPLE", "pair_7_APPLE"
  number?: number; // 1-25
  word?: string; // e.g. "APPLE"
}

export type BingoBoard = BingoItem[][]; // 5x5 matrix
export type MarkedGrid = boolean[][]; // 5x5 boolean matrix

export interface WinningPattern {
  type: 'row' | 'col' | 'diagonal';
  index?: number; // row index (0-4) or col index (0-4)
  name: string; // e.g. "Row 1", "Column B", "Main Diagonal"
  coordinates: [number, number][]; // list of 5 coordinates [row, col]
}

export interface WinnerInfo {
  playerId: string;
  playerName: string;
  winningPattern: WinningPattern;
  winningItems: BingoItem[];
}

export interface MoveRecord {
  item: BingoItem;
  selectedBy: string;
  selectedByName: string;
  hasMatch: boolean; // whether opponent had the item on their board
  markedOnOpponent: boolean; // whether opponent's cell was automatically marked
  timestamp: number;
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
  mode: GameMode;
  phase: GamePhase;
  players: PlayerState[];
  activePlayerId: string | null;
  lastMove: MoveRecord | null;
  playHistory: MoveRecord[];
  allSelectedItems: BingoItem[];
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
    mode: GameMode;
    phase: GamePhase;
    round: number;
    countdown: number;
    activePlayerId: string | null;
    lastMove: MoveRecord | null;
    playHistory: MoveRecord[];
    allSelectedItems: BingoItem[];
    isMyTurn: boolean;
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
  | 'NOT_YOUR_TURN'
  | 'ITEM_ALREADY_SELECTED'
  | 'INVALID_SELECTION'
  | 'CELL_ALREADY_MARKED'
  | 'GAME_OVER'
  | 'INVALID_SESSION'
  | 'INVALID_NAME'
  | 'INVALID_MODE';

export interface ServerErrorResponse {
  code: ErrorCode;
  message: string;
}

