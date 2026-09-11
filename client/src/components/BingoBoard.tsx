import React from 'react';
import type {
  BingoBoard as BingoBoardType,
  BingoItem,
  GameMode,
  MarkedGrid,
  WinningPattern,
} from '../types/game';
import { BingoCell } from './BingoCell';

interface BingoBoardProps {
  board: BingoBoardType;
  mode: GameMode;
  markedCells: MarkedGrid;
  winningPattern?: WinningPattern | null;
  isGameActive: boolean;
  isMyTurn: boolean;
  onCellClick?: (row: number, col: number, item: BingoItem) => void;
}

const COLUMNS = [
  { letter: 'B', color: 'text-[#FB7185] bg-[#E11D48]/15 border-[#E11D48]/30' },
  { letter: 'I', color: 'text-[#F59E0B] bg-[#D97706]/15 border-[#D97706]/30' },
  { letter: 'N', color: 'text-[#34D399] bg-[#059669]/15 border-[#059669]/30' },
  { letter: 'G', color: 'text-[#FB923C] bg-[#EA580C]/15 border-[#EA580C]/30' },
  { letter: 'O', color: 'text-[#C084FC] bg-[#7C3AED]/15 border-[#7C3AED]/30' },
];

export const BingoBoard: React.FC<BingoBoardProps> = ({
  board,
  mode,
  markedCells,
  winningPattern,
  isGameActive,
  isMyTurn,
  onCellClick,
}) => {
  const isWinningCoord = (r: number, c: number): boolean => {
    if (!winningPattern || !winningPattern.coordinates) return false;
    return winningPattern.coordinates.some(([wr, wc]) => wr === r && wc === c);
  };

  const handleCellClick = (r: number, c: number, item: BingoItem) => {
    if (onCellClick) {
      onCellClick(r, c, item);
    }
  };

  return (
    <div className="w-full max-w-[460px] mx-auto bg-[#1A1D24] border border-[#313644] rounded-3xl p-3.5 sm:p-5 shadow-xl relative">
      {/* Column Headers B-I-N-G-O */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-2.5 sm:mb-3">
        {COLUMNS.map((col, idx) => (
          <div
            key={col.letter}
            className={`flex flex-col items-center justify-center py-2 rounded-2xl border font-black shadow-sm select-none ${col.color}`}
          >
            <span className="text-xl sm:text-2xl tracking-wider leading-none font-black">{col.letter}</span>
            <span className="text-[9px] font-bold opacity-75 mt-0.5">COL {idx + 1}</span>
          </div>
        ))}
      </div>

      {/* 5x5 Grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {board.map((row, rIdx) =>
          row.map((item, cIdx) => {
            const isMarked = markedCells[rIdx]?.[cIdx] ?? false;
            const isWinning = isWinningCoord(rIdx, cIdx);

            return (
              <BingoCell
                key={item?.id ?? `${rIdx}-${cIdx}`}
                row={rIdx}
                col={cIdx}
                item={item}
                mode={mode}
                isMarked={isMarked}
                isWinningCell={isWinning}
                isGameActive={isGameActive}
                isMyTurn={isMyTurn}
                onCellClick={handleCellClick}
              />
            );
          })
        )}
      </div>

      {/* Dynamic Turn Tips Footer */}
      {isGameActive && (
        <div className="mt-3.5 text-center">
          {isMyTurn ? (
            <p className="text-xs text-[#F59E0B] font-bold animate-pulse">
              🎯 Your turn! Tap any unmarked tile on your board to choose it.
            </p>
          ) : (
            <p className="text-xs text-[#A8A296] font-medium">
              ⏳ Opponent is choosing a tile from their board...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

