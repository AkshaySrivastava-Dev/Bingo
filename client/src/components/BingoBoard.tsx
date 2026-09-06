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
  { letter: 'B', range: '1–15', color: 'text-[#FB7185] bg-[#E11D48]/15 border-[#E11D48]/30' },
  { letter: 'I', range: '16–30', color: 'text-[#F59E0B] bg-[#D97706]/15 border-[#D97706]/30' },
  { letter: 'N', range: '31–45', color: 'text-[#34D399] bg-[#059669]/15 border-[#059669]/30' },
  { letter: 'G', range: '46–60', color: 'text-[#FB923C] bg-[#EA580C]/15 border-[#EA580C]/30' },
  { letter: 'O', range: '61–75', color: 'text-[#C084FC] bg-[#7C3AED]/15 border-[#7C3AED]/30' },
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
    <div className="w-full max-w-[460px] mx-auto bg-[#1A1D24] border border-[#313644] rounded-3xl p-3.5 sm:p-5 shadow-xl relative">
      {/* Column Headers B-I-N-G-O */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-2.5 sm:mb-3">
        {COLUMNS.map((col) => (
          <div
            key={col.letter}
            className={`flex flex-col items-center justify-center py-2 rounded-2xl border font-black shadow-sm select-none ${col.color}`}
          >
            <span className="text-xl sm:text-2xl tracking-wider leading-none font-black">{col.letter}</span>
            <span className="text-[10px] font-bold opacity-75 mt-0.5">{col.range}</span>
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

      {/* Bottom Tip */}
      {isGameActive && (
        <div className="mt-3.5 text-center">
          <p className="text-xs text-[#A8A296] font-medium">
            💡 Tap <span className="text-[#F59E0B] font-bold">amber highlighted cells</span> when your number is drawn!
          </p>
        </div>
      )}
    </div>
  );
};

