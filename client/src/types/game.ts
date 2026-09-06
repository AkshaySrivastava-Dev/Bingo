export type GamePhase =
  | 'WAITING_FOR_PLAYER'
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'GAME_OVER';

export type TurnState = 'SELECTING' | 'WAITING_FOR_RESPONSE';

export type BingoBoard = number[][]; // 5x5 matrix
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
  winningNumbers: number[];
}

export interface MoveRecord {
  number: number;
  letter: string;
  selectedBy: string;
  selectedByName: string;
  hasMatch: boolean;
  markedByOpponent: boolean;
  timestamp: number;
}

export interface PendingNumber {
  number: number;
  letter: string;
  selectedBy: string;
  selectedByName: string;
  responderId: string;
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
    phase: GamePhase;
    round: number;
    countdown: number;
    activePlayerId: string | null;
    turnState: TurnState;
    pendingNumber: PendingNumber | null;
    lastSelectedNumber: { number: number; letter: string; selectedBy: string; selectedByName: string } | null;
    playHistory: MoveRecord[];
    allSelectedNumbers: number[];
    isMyTurn: boolean;
    isPendingResponder: boolean;
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

