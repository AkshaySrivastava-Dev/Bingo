import React from 'react';
import { Star, Check, Sparkles } from 'lucide-react';

export type CellMode = 'select' | 'stamp' | 'marked' | 'winning' | 'disabled';

interface BingoCellProps {
  row: number;
  col: number;
  value: number; // 0 is FREE
  isMarked: boolean;
  isWinningCell: boolean;
  isGameActive: boolean;
  cellMode: CellMode;
  onCellClick: (row: number, col: number, value: number) => void;
}

export const BingoCell: React.FC<BingoCellProps> = ({
  row,
  col,
  value,
  isMarked,
  isWinningCell,
  isGameActive,
  cellMode,
  onCellClick,
}) => {
  const isFree = value === 0 || (row === 2 && col === 2);
  const isClickable = cellMode === 'select' || cellMode === 'stamp';

  const handleClick = () => {
    if (isClickable && isGameActive) {
      onCellClick(row, col, value);
    }
  };

  // State Styling
  let cellClass = 'bg-[#222630] border border-[#363C4C] text-[#F4EFE6] shadow-[0_3px_0_#14171E]';
  let content = (
    <span className="text-xl sm:text-2xl font-black tracking-tight font-mono">
      {value}
    </span>
  );

  if (cellMode === 'winning' || isWinningCell) {
    // 1. Winning state: Warm golden victory tile
    cellClass =
      'bg-gradient-to-b from-[#F59E0B] to-[#D97706] border-2 border-[#FDE68A] text-[#12141A] font-black shadow-[0_3px_0_#92400E] scale-[1.03] z-10';
    content = (
      <div className="flex flex-col items-center justify-center">
        {isFree ? (
          <Star className="w-5 h-5 fill-[#12141A] text-[#12141A]" />
        ) : (
          <span className="text-xl sm:text-2xl font-black font-mono">{value}</span>
        )}
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5" /> WIN
        </span>
      </div>
    );
  } else if (cellMode === 'marked' || isMarked) {
    // 2. Marked state: Rich stamped ink seal
    if (isFree) {
      cellClass =
        'bg-gradient-to-b from-[#D97706] to-[#B45309] border border-[#F59E0B] text-[#12141A] shadow-[0_2px_0_#78350F]';
      content = (
        <div className="flex flex-col items-center">
          <Star className="w-5 h-5 fill-[#12141A] text-[#12141A] mb-0.5" />
          <span className="text-[10px] font-black tracking-widest text-[#12141A]">FREE</span>
        </div>
      );
    } else {
      cellClass =
        'bg-[#E11D48] border border-[#F43F5E] text-white shadow-[0_2px_0_#9F1239] animate-tile-stamp';
      content = (
        <div className="relative flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black tracking-tight font-mono">{value}</span>
          <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#F59E0B] text-[#12141A] flex items-center justify-center text-[10px] shadow border border-[#FDFBF7]">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </span>
        </div>
      );
    }
  } else if (cellMode === 'stamp') {
    // 3. Opponent called this number -> Must Stamp! (Pulsing Amber Attention ring)
    cellClass =
      'bg-[#D97706]/25 border-2 border-[#F59E0B] text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer tile-press animate-pulse';
    content = (
      <div className="flex flex-col items-center justify-center">
        <span className="text-xl sm:text-2xl font-black text-[#F59E0B] font-mono">
          {value}
        </span>
        <span className="text-[9px] font-black text-[#F59E0B] uppercase tracking-widest mt-0.5 bg-[#F59E0B]/20 px-1.5 py-0.2 rounded">
          STAMP
        </span>
      </div>
    );
  } else if (cellMode === 'select') {
    // 4. My turn to select a number -> Pickable unmarked number
    cellClass =
      'bg-[#222630] border-2 border-[#363C4C] hover:border-[#F59E0B] hover:bg-[#2B303C] text-[#F4EFE6] hover:text-[#F59E0B] shadow-[0_3px_0_#14171E] cursor-pointer tile-press group';
    content = (
      <div className="flex flex-col items-center justify-center">
        <span className="text-xl sm:text-2xl font-black tracking-tight font-mono group-hover:scale-105 transition-transform">
          {value}
        </span>
        <span className="text-[8px] font-black uppercase tracking-wider text-[#A8A296] group-hover:text-[#F59E0B] transition-colors mt-0.5">
          CHOOSE
        </span>
      </div>
    );
  } else {
    // 5. Default / Disabled state
    cellClass += ' opacity-85';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable || !isGameActive}
      aria-label={`Row ${row + 1}, Col ${col + 1}, Value ${isFree ? 'FREE' : value}`}
      className={`relative flex items-center justify-center aspect-square rounded-2xl transition-all select-none p-1 sm:p-2 ${cellClass} ${
        isClickable ? 'active:translate-y-[2px] active:shadow-none' : ''
      }`}
    >
      {content}
    </button>
  );
};

