import React from 'react';
import type {
  BingoBoard as BingoBoardType,
  MarkedGrid,
  WinningPattern,
  TurnState,
  PendingNumber,
} from '../types/game';
import { BingoCell, type CellMode } from './BingoCell';

interface BingoBoardProps {
  board: BingoBoardType;
  markedCells: MarkedGrid;
  winningPattern?: WinningPattern | null;
  isGameActive: boolean;
  isMyTurn: boolean;
  turnState: TurnState;
  isPendingResponder: boolean;
  pendingNumber: PendingNumber | null;
  allSelectedNumbers: number[];
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
  winningPattern,
  isGameActive,
  isMyTurn,
  turnState,
  isPendingResponder,
  pendingNumber,
  allSelectedNumbers,
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
            const isWinning = isWinningCoord(rIdx, cIdx);

            let cellMode: CellMode = 'disabled';
            if (isWinning) {
              cellMode = 'winning';
            } else if (isMarked) {
              cellMode = 'marked';
            } else if (isGameActive) {
              if (
                isPendingResponder &&
                turnState === 'WAITING_FOR_RESPONSE' &&
                pendingNumber &&
                pendingNumber.number === val
              ) {
                cellMode = 'stamp';
              } else if (
                isMyTurn &&
                turnState === 'SELECTING' &&
                val !== 0 &&
                !allSelectedNumbers.includes(val)
              ) {
                cellMode = 'select';
              }
            }

            return (
              <BingoCell
                key={`${rIdx}-${cIdx}`}
                row={rIdx}
                col={cIdx}
                value={val}
                isMarked={isMarked}
                isWinningCell={isWinning}
                isGameActive={isGameActive}
                cellMode={cellMode}
                onCellClick={onCellClick}
              />
            );
          })
        )}
      </div>

      {/* Dynamic Status / Tips Footer */}
      {isGameActive && (
        <div className="mt-3.5 text-center">
          {isMyTurn && turnState === 'SELECTING' && (
            <p className="text-xs text-[#F59E0B] font-bold animate-pulse">
              🎯 Your turn! Tap any unmarked number on your board to choose it.
            </p>
          )}
          {isPendingResponder && turnState === 'WAITING_FOR_RESPONSE' && (
            <p className="text-xs text-[#F59E0B] font-bold animate-pulse">
              ⚡ Opponent chose {pendingNumber?.number}! Tap the glowing cell to STAMP it.
            </p>
          )}
          {isMyTurn && turnState === 'WAITING_FOR_RESPONSE' && (
            <p className="text-xs text-[#A8A296] font-medium">
              ⏳ Waiting for opponent to check their board for <span className="text-[#F59E0B] font-bold font-mono">{pendingNumber?.number}</span>...
            </p>
          )}
          {!isMyTurn && turnState === 'SELECTING' && (
            <p className="text-xs text-[#A8A296] font-medium">
              ⏳ Opponent is choosing a number from their board...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

