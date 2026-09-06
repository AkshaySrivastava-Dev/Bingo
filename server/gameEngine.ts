import { BingoBoard, MarkedGrid, WinningPattern } from './types.js';

// Helper to get random sample of k unique numbers from [min, max]
function sampleUnique(min: number, max: number, count: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) {
    pool.push(i);
  }
  // Fisher-Yates partial shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/**
 * Generate a standard 5x5 Bingo board:
 * B: 1-15 (5 numbers)
 * I: 16-30 (5 numbers)
 * N: 31-45 (4 numbers + 1 FREE at center)
 * G: 46-60 (5 numbers)
 * O: 61-75 (5 numbers)
 */
export function generateBingoBoard(): BingoBoard {
  const colB = sampleUnique(1, 15, 5);
  const colI = sampleUnique(16, 30, 5);
  const colN = sampleUnique(31, 45, 4); // 4 numbers, index 2 will be replaced by 0 (FREE)
  const colG = sampleUnique(46, 60, 5);
  const colO = sampleUnique(61, 75, 5);

  const board: BingoBoard = [
    [colB[0], colI[0], colN[0], colG[0], colO[0]],
    [colB[1], colI[1], colN[1], colG[1], colO[1]],
    [colB[2], colI[2], 0,         colG[2], colO[2]], // Center FREE space is 0
    [colB[3], colI[3], colN[2], colG[3], colO[3]],
    [colB[4], colI[4], colN[3], colG[4], colO[4]],
  ];

  return board;
}

/**
 * Create initial 5x5 marked grid with center FREE space marked.
 */
export function createInitialMarkedGrid(): MarkedGrid {
  const marked: MarkedGrid = Array(5)
    .fill(null)
    .map(() => Array(5).fill(false));
  marked[2][2] = true; // FREE space is pre-marked
  return marked;
}

/**
 * Shuffles 1..75 pool for authoritative game calling.
 */
export function shuffleNumberPool(): number[] {
  const pool: number[] = [];
  for (let i = 1; i <= 75; i++) {
    pool.push(i);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * Get Bingo column letter for a number 1-75
 */
export function getNumberLetter(num: number): string {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
}

/**
 * Calculates line statistics for progress reporting
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
 * Checks if the board has achieved a valid Bingo line (Row, Column, or Diagonal).
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
 * Extracts the values on the board corresponding to a winning pattern
 */
export function getWinningNumbers(board: BingoBoard, pattern: WinningPattern): number[] {
  return pattern.coordinates.map(([r, c]) => board[r][c]);
}
