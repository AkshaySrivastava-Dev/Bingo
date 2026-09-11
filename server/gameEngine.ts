import { BingoBoard, BingoItem, GameMode, MarkedGrid, WinningPattern } from './types.js';

export const BINGO_WORDS: string[] = [
  'APPLE', 'TIGER', 'ROCKET', 'OCEAN', 'MUSIC', 'SUN', 'MOON', 'FIRE', 'STAR', 'RIVER',
  'MOUNTAIN', 'GUITAR', 'FLOWER', 'CASTLE', 'THUNDER', 'FOREST', 'DRAGON', 'CLOUD', 'CAMERA', 'PLANET',
  'COFFEE', 'PIZZA', 'BICYCLE', 'DIAMOND', 'RAINBOW', 'EAGLE', 'ISLAND', 'WIZARD', 'VOLCANO', 'ROBOT',
  'GALAXY', 'CROWN', 'BRIDGE', 'DESERT', 'PIRATE', 'PALACE', 'MAGNET', 'SHADOW', 'METEOR', 'JUNGLE',
  'ANCHOR', 'CRYSTAL', 'FALCON', 'LIGHTNING', 'OCTOPUS', 'PENGUIN', 'SPIDER', 'TEMPLE', 'UNICORN', 'WHALE',
  'ZEBRA', 'BUTTERFLY', 'DOLPHIN', 'HARBOR', 'KNIGHT', 'LANTERN', 'PHOENIX', 'SAFARI', 'TREASURE', 'VORTEX',
  'BALLOON', 'CACTUS', 'COMPASS', 'FEATHER', 'GLACIER', 'HORIZON', 'IGLOO', 'JOURNEY', 'KANGAROO', 'LAGOON',
  'MIRAGE', 'NEBULA', 'OASIS', 'PEACOCK', 'QUASAR', 'SAILBOAT', 'TORNADO', 'VOYAGE', 'WATERFALL', 'ZENITH'
];

// Helper to shuffle an array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Helper to get random sample of k unique items
function sampleUnique<T>(pool: T[], count: number): T[] {
  return shuffle(pool).slice(0, count);
}

/**
 * Generate a 5x5 Bingo board containing 25 unique items based on selected GameMode.
 * NO FREE space. Every cell has a playable item.
 */
export function generateBingoBoard(mode: GameMode = 'NUMBERS_ONLY'): BingoBoard {
  const board: BingoBoard = [];

  if (mode === 'NUMBERS_ONLY') {
    // Exactly numbers 1 to 25, all 25 unique, shuffled
    const numbers = shuffle(Array.from({ length: 25 }, (_, i) => i + 1));
    for (let r = 0; r < 5; r++) {
      const row: BingoItem[] = [];
      for (let c = 0; c < 5; c++) {
        const num = numbers[r * 5 + c];
        row.push({
          id: `num_${num}`,
          number: num,
        });
      }
      board.push(row);
    }
  } else if (mode === 'WORDS_ONLY') {
    // 25 unique words sampled from BINGO_WORDS
    const words = sampleUnique(BINGO_WORDS, 25);
    for (let r = 0; r < 5; r++) {
      const row: BingoItem[] = [];
      for (let c = 0; c < 5; c++) {
        const word = words[r * 5 + c];
        row.push({
          id: `word_${word}`,
          word,
        });
      }
      board.push(row);
    }
  } else if (mode === 'NUMBERS_AND_WORDS') {
    // 25 unique number-word pairs (numbers 1-25 paired with 25 unique words)
    const numbers = shuffle(Array.from({ length: 25 }, (_, i) => i + 1));
    const words = sampleUnique(BINGO_WORDS, 25);
    for (let r = 0; r < 5; r++) {
      const row: BingoItem[] = [];
      for (let c = 0; c < 5; c++) {
        const num = numbers[r * 5 + c];
        const word = words[r * 5 + c];
        row.push({
          id: `pair_${num}_${word}`,
          number: num,
          word,
        });
      }
      board.push(row);
    }
  }

  return board;
}

/**
 * Create initial 5x5 marked grid with ALL 25 cells unmarked.
 * NO FREE SPACE.
 */
export function createInitialMarkedGrid(): MarkedGrid {
  return Array(5)
    .fill(null)
    .map(() => Array(5).fill(false));
}

/**
 * Checks equality between two BingoItems based on the active GameMode.
 */
export function areItemsEqual(a: BingoItem, b: BingoItem, mode: GameMode): boolean {
  if (mode === 'NUMBERS_ONLY') {
    return a.number !== undefined && b.number !== undefined && a.number === b.number;
  }
  if (mode === 'WORDS_ONLY') {
    return a.word !== undefined && b.word !== undefined && a.word === b.word;
  }
  if (mode === 'NUMBERS_AND_WORDS') {
    return (
      a.number !== undefined &&
      b.number !== undefined &&
      a.number === b.number &&
      a.word !== undefined &&
      b.word !== undefined &&
      a.word === b.word
    );
  }
  return false;
}

/**
 * Searches for a matching item on a 5x5 Bingo board and returns its (row, col) coordinates or null.
 */
export function findItemOnBoard(
  board: BingoBoard,
  target: BingoItem,
  mode: GameMode
): { row: number; col: number } | null {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (areItemsEqual(board[r][c], target, mode)) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

/**
 * Formats a BingoItem into a readable string representation according to the GameMode.
 */
export function formatItemLabel(item: BingoItem, mode: GameMode): string {
  if (mode === 'NUMBERS_ONLY') {
    return item.number !== undefined ? `${item.number}` : '';
  }
  if (mode === 'WORDS_ONLY') {
    return item.word || '';
  }
  if (mode === 'NUMBERS_AND_WORDS') {
    return `${item.number || ''} ${item.word || ''}`.trim();
  }
  return '';
}

/**
 * Calculates line statistics for progress reporting (0-5).
 */
export function calculateProgress(marked: MarkedGrid): { bestLineCount: number; completedLines: number } {
  let maxLine = 0;
  let completed = 0;

  // Check 5 Rows
  for (let r = 0; r < 5; r++) {
    let count = 0;
    for (let c = 0; c < 5; c++) {
      if (marked[r][c]) count++;
    }
    if (count > maxLine) maxLine = count;
    if (count === 5) completed++;
  }

  // Check 5 Columns
  for (let c = 0; c < 5; c++) {
    let count = 0;
    for (let r = 0; r < 5; r++) {
      if (marked[r][c]) count++;
    }
    if (count > maxLine) maxLine = count;
    if (count === 5) completed++;
  }

  // Main Diagonal (0,0) -> (4,4)
  let diag1Count = 0;
  for (let i = 0; i < 5; i++) {
    if (marked[i][i]) diag1Count++;
  }
  if (diag1Count > maxLine) maxLine = diag1Count;
  if (diag1Count === 5) completed++;

  // Anti Diagonal (0,4) -> (4,0)
  let diag2Count = 0;
  for (let i = 0; i < 5; i++) {
    if (marked[i][4 - i]) diag2Count++;
  }
  if (diag2Count > maxLine) maxLine = diag2Count;
  if (diag2Count === 5) completed++;

  return {
    bestLineCount: maxLine,
    completedLines: completed,
  };
}

/**
 * Checks if the board has achieved a valid Bingo line of 5 marked cells (Row, Column, or Diagonal).
 * Returns the winning pattern with coordinates if true, null otherwise.
 */
export function checkBingo(marked: MarkedGrid): WinningPattern | null {
  // 1. Check Rows
  for (let r = 0; r < 5; r++) {
    if (marked[r].every((val) => val)) {
      const coords: [number, number][] = [
        [r, 0],
        [r, 1],
        [r, 2],
        [r, 3],
        [r, 4],
      ];
      return {
        type: 'row',
        index: r,
        name: `Row ${r + 1}`,
        coordinates: coords,
      };
    }
  }

  // 2. Check Columns
  const colLetters = ['B', 'I', 'N', 'G', 'O'];
  for (let c = 0; c < 5; c++) {
    let colFull = true;
    for (let r = 0; r < 5; r++) {
      if (!marked[r][c]) {
        colFull = false;
        break;
      }
    }
    if (colFull) {
      const coords: [number, number][] = [
        [0, c],
        [1, c],
        [2, c],
        [3, c],
        [4, c],
      ];
      return {
        type: 'col',
        index: c,
        name: `Column ${colLetters[c]}`,
        coordinates: coords,
      };
    }
  }

  // 3. Main Diagonal
  let mainDiagFull = true;
  const mainCoords: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    mainCoords.push([i, i]);
    if (!marked[i][i]) {
      mainDiagFull = false;
    }
  }
  if (mainDiagFull) {
    return {
      type: 'diagonal',
      name: 'Diagonal (Top-Left to Bottom-Right)',
      coordinates: mainCoords,
    };
  }

  // 4. Anti Diagonal
  let antiDiagFull = true;
  const antiCoords: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    antiCoords.push([i, 4 - i]);
    if (!marked[i][4 - i]) {
      antiDiagFull = false;
    }
  }
  if (antiDiagFull) {
    return {
      type: 'diagonal',
      name: 'Diagonal (Top-Right to Bottom-Left)',
      coordinates: antiCoords,
    };
  }

  return null;
}

/**
 * Extracts the items on the board corresponding to a winning pattern.
 */
export function getWinningItems(board: BingoBoard, pattern: WinningPattern): BingoItem[] {
  return pattern.coordinates.map(([r, c]) => board[r][c]);
}


