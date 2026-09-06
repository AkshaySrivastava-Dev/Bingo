import React from 'react';
import type { BingoBoard as BingoBoardType, MarkedGrid, WinningPattern } from '../types/game';
import { BingoCell } from './BingoCell';

interface BingoBoardProps {
  board: BingoBoardType;
  markedCells: MarkedGrid;
  calledNumbers: number[];
  winningPattern?: WinningPattern | null;
  isGameActive: boolean;
  onCellClick: (row: number, col: number, value: number) => void;
}

const COLUMNS = [
  { letter: 'B', range: '1-15', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  { letter: 'I', range: '16-30', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { letter: 'N', range: '31-45', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { letter: 'G', range: '46-60', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { letter: 'O', range: '61-75', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
];

export const BingoBoard: React.FC<BingoBoardProps> = ({
  board,
  markedCells,
  calledNumbers,
  winningPattern,
  isGameActive,
  onCellClick,
}) => {
  const isWinningCoord = (r: number, c: number): boolean => {
    if (!winningPattern || !winningPattern.coordinates) return false;
    return winningPattern.coordinates.some(([wr, wc]) => wr === r && wc === c);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#0E1526]/90 border border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-2xl backdrop-blur-xl transition-all">
      {/* Column Headers B-I-N-G-O */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-2 sm:mb-3">
        {COLUMNS.map((col) => (
          <div
            key={col.letter}
            className={`flex flex-col items-center justify-center py-2 rounded-xl sm:rounded-2xl border font-black shadow-sm ${col.color}`}
          >
            <span className="text-xl sm:text-2xl tracking-wider leading-none">{col.letter}</span>
            <span className="text-[10px] sm:text-[11px] font-medium opacity-80 mt-0.5">{col.range}</span>
          </div>
        ))}
      </div>

      {/* 5x5 Grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {board.map((row, rIdx) =>
          row.map((val, cIdx) => {
            const isMarked = markedCells[rIdx]?.[cIdx] ?? false;
            const isCalled = val === 0 || calledNumbers.includes(val);
            const isWinning = isWinningCoord(rIdx, cIdx);

            return (
              <BingoCell
                key={`${rIdx}-${cIdx}`}
                row={rIdx}
                col={cIdx}
                value={val}
                isMarked={isMarked}
                isCalled={isCalled}
                isWinningCell={isWinning}
                isGameActive={isGameActive}
                onCellClick={onCellClick}
              />
            );
          })
        )}
      </div>

      {/* Bottom Board Hint */}
      {isGameActive && (
        <div className="mt-3.5 text-center">
          <p className="text-xs text-slate-400 font-medium">
            💡 Tap <span className="text-pink-400 font-semibold">flashing cells</span> when your numbers are called!
          </p>
        </div>
      )}
    </div>
  );
};
