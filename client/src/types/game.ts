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
  index?: number;
  name: string;
  coordinates: [number, number][];
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
  hasMatch: boolean;
  markedOnOpponent: boolean;
  timestamp: number;
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

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

