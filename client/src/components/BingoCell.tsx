import React from 'react';
import { Star, Check } from 'lucide-react';

interface BingoCellProps {
  row: number;
  col: number;
  value: number; // 0 is FREE
  isMarked: boolean;
  isCalled: boolean;
  isWinningCell: boolean;
  isGameActive: boolean;
  onCellClick: (row: number, col: number, value: number) => void;
}

export const BingoCell: React.FC<BingoCellProps> = ({
  row,
  col,
  value,
  isMarked,
  isCalled,
  isWinningCell,
  isGameActive,
  onCellClick,
}) => {
  const isFree = value === 0 || (row === 2 && col === 2);
  const isEligibleToMark = isGameActive && !isMarked && (isCalled || isFree);

  const handleClick = () => {
    if (isEligibleToMark) {
      onCellClick(row, col, value);
    }
  };

  // State Styling
  let cellClass = 'bg-[#222630] border border-[#363C4C] text-[#F4EFE6] shadow-[0_3px_0_#14171E]';
  let content = (
    <span className="text-xl sm:text-2xl font-black tracking-tight">
      {value}
    </span>
  );

  if (isWinningCell) {
    // 1. Winning state: Warm golden victory tile
    cellClass =
      'bg-gradient-to-b from-[#F59E0B] to-[#D97706] border-2 border-[#FDE68A] text-[#12141A] font-black shadow-[0_3px_0_#92400E] scale-[1.03] z-10';
    content = (
      <div className="flex flex-col items-center justify-center">
        {isFree ? (
          <Star className="w-5 h-5 fill-[#12141A] text-[#12141A]" />
        ) : (
          <span className="text-xl sm:text-2xl font-black">{value}</span>
        )}
        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">WIN</span>
      </div>
    );
  } else if (isMarked) {
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
          <span className="text-xl sm:text-2xl font-black tracking-tight">{value}</span>
          <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#F59E0B] text-[#12141A] flex items-center justify-center text-[10px] shadow border border-[#FDFBF7]">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </span>
        </div>
      );
    }
  } else if (isEligibleToMark) {
    // 3. Called and ready to mark (Warm Amber Attention ring)
    cellClass =
      'bg-[#D97706]/20 border-2 border-[#F59E0B] text-[#F59E0B] shadow-[0_3px_0_#92400E] cursor-pointer tile-press';
    content = (
      <div className="flex flex-col items-center justify-center">
        <span className="text-xl sm:text-2xl font-black text-[#F59E0B]">
          {value}
        </span>
        <span className="text-[9px] font-black text-[#F59E0B] uppercase tracking-widest mt-0.5">
          STAMP
        </span>
      </div>
    );
  } else {
    // 4. Default state
    cellClass += isGameActive ? ' hover:bg-[#2A2E3B] hover:border-[#4A5164]' : ' opacity-90';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isEligibleToMark}
      aria-label={`Row ${row + 1}, Col ${col + 1}, Value ${isFree ? 'FREE' : value}`}
      className={`group relative flex items-center justify-center aspect-square rounded-2xl transition-all select-none p-1 sm:p-2 ${cellClass} ${
        isEligibleToMark ? 'active:translate-y-[2px] active:shadow-none' : ''
      }`}
    >
      {content}
    </button>
  );
};

