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

  // State styling
  let cellClass = 'bg-[#121A2D] border-slate-800/80 text-slate-200';
  let content = <span className="text-xl sm:text-2xl font-bold tracking-tight">{value}</span>;

  if (isWinningCell) {
    cellClass =
      'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 border-amber-300 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse scale-[1.02] z-10';
    content = (
      <div className="flex flex-col items-center justify-center">
        {isFree ? <Star className="w-5 h-5 fill-slate-950 text-slate-950" /> : <span className="text-xl sm:text-2xl font-black">{value}</span>}
        <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">WIN</span>
      </div>
    );
  } else if (isMarked) {
    cellClass =
      'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 border-indigo-400/70 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)]';
    content = (
      <div className="relative flex flex-col items-center justify-center">
        {isFree ? (
          <div className="flex flex-col items-center">
            <Star className="w-5 h-5 fill-amber-300 text-amber-300 mb-0.5 animate-pulse" />
            <span className="text-[10px] font-extrabold tracking-wider text-amber-200">FREE</span>
          </div>
        ) : (
          <>
            <span className="text-xl sm:text-2xl font-black tracking-tight">{value}</span>
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          </>
        )}
      </div>
    );
  } else if (isEligibleToMark) {
    // Called and ready to be stamped by the user!
    cellClass =
      'bg-[#19233C] border-pink-500/80 text-pink-200 hover:bg-[#202E4E] hover:border-pink-400 cursor-pointer beacon-pulse shadow-[0_0_14px_rgba(236,72,153,0.3)] animate-pop-in';
    content = (
      <div className="flex flex-col items-center justify-center">
        <span className="text-xl sm:text-2xl font-black text-pink-300 group-hover:scale-110 transition-transform">
          {value}
        </span>
        <span className="text-[9px] font-bold text-pink-400 uppercase tracking-wider mt-0.5 animate-bounce">
          CLICK
        </span>
      </div>
    );
  } else {
    // Regular cell or not yet called
    cellClass += isGameActive ? ' opacity-75 hover:opacity-100 hover:border-slate-700' : '';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isEligibleToMark}
      aria-label={`Row ${row + 1}, Col ${col + 1}, Value ${isFree ? 'FREE' : value}`}
      className={`group relative flex items-center justify-center aspect-square rounded-xl sm:rounded-2xl border-2 transition-all duration-200 select-none p-1 sm:p-2 ${cellClass} ${
        isEligibleToMark ? 'active:scale-95' : ''
      }`}
    >
      {content}
    </button>
  );
};
