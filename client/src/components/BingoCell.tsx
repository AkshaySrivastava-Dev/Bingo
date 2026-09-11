import React from 'react';
import type { BingoItem, GameMode } from '../types/game';
import { Check, Sparkles } from 'lucide-react';

interface BingoCellProps {
  row: number;
  col: number;
  item: BingoItem;
  mode: GameMode;
  isMarked: boolean;
  isWinningCell: boolean;
  isGameActive: boolean;
  isMyTurn: boolean;
  onCellClick: (row: number, col: number, item: BingoItem) => void;
}

export const BingoCell: React.FC<BingoCellProps> = ({
  row,
  col,
  item,
  mode,
  isMarked,
  isWinningCell,
  isGameActive,
  isMyTurn,
  onCellClick,
}) => {
  const isClickable = isGameActive && isMyTurn && !isMarked;

  const handleClick = () => {
    if (isClickable) {
      onCellClick(row, col, item);
    }
  };

  const renderItemContent = (textColorClass?: string) => {
    if (mode === 'NUMBERS_ONLY') {
      return (
        <span className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${textColorClass || ''}`}>
          {item.number}
        </span>
      );
    }

    if (mode === 'WORDS_ONLY') {
      return (
        <span
          className={`text-[11px] sm:text-xs font-black uppercase tracking-wider text-center leading-tight px-1 line-clamp-2 ${
            textColorClass || ''
          }`}
        >
          {item.word}
        </span>
      );
    }

    if (mode === 'NUMBERS_AND_WORDS') {
      return (
        <div className="flex flex-col items-center justify-center text-center px-0.5">
          <span className={`text-base sm:text-lg font-black font-mono leading-none ${textColorClass ? textColorClass : 'text-[#F59E0B]'}`}>
            {item.number}
          </span>
          <span
            className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-tight leading-tight mt-0.5 truncate max-w-full ${
              textColorClass || 'text-[#F4EFE6]'
            }`}
          >
            {item.word}
          </span>
        </div>
      );
    }

    return null;
  };

  // State Styling
  let cellClass = 'bg-[#222630] border border-[#363C4C] text-[#F4EFE6] shadow-[0_3px_0_#14171E]';
  let content = renderItemContent();

  if (isWinningCell) {
    // 1. Winning state: Warm golden victory tile
    cellClass =
      'bg-gradient-to-b from-[#F59E0B] to-[#D97706] border-2 border-[#FDE68A] text-[#12141A] font-black shadow-[0_3px_0_#92400E] scale-[1.03] z-10';
    content = (
      <div className="flex flex-col items-center justify-center text-[#12141A]">
        {renderItemContent('text-[#12141A]')}
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-0.5 text-[#12141A]">
          <Sparkles className="w-2.5 h-2.5" /> WIN
        </span>
      </div>
    );
  } else if (isMarked) {
    // 2. Marked state: Rich stamped ink seal
    cellClass =
      'bg-[#E11D48] border border-[#F43F5E] text-white shadow-[0_2px_0_#9F1239] animate-tile-stamp';
    content = (
      <div className="relative flex flex-col items-center justify-center w-full h-full">
        {renderItemContent('text-white')}
        <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#F59E0B] text-[#12141A] flex items-center justify-center text-[10px] shadow border border-[#FDFBF7]">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      </div>
    );
  } else if (isClickable) {
    // 3. My turn to select: Pickable unmarked item
    cellClass =
      'bg-[#222630] border-2 border-[#363C4C] hover:border-[#F59E0B] hover:bg-[#2B303C] text-[#F4EFE6] hover:text-[#F59E0B] shadow-[0_3px_0_#14171E] cursor-pointer tile-press group active:translate-y-[2px] active:shadow-none';
    content = (
      <div className="flex flex-col items-center justify-center w-full">
        {renderItemContent('group-hover:text-[#F59E0B]')}
        <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-[#A8A296] group-hover:text-[#F59E0B] transition-colors mt-0.5 opacity-0 group-hover:opacity-100">
          PICK
        </span>
      </div>
    );
  } else {
    // 4. Default / Disabled state
    cellClass += isGameActive ? ' opacity-85' : ' opacity-90';
  }

  const ariaLabel =
    mode === 'NUMBERS_ONLY'
      ? `Row ${row + 1}, Col ${col + 1}, Number ${item.number}`
      : mode === 'WORDS_ONLY'
      ? `Row ${row + 1}, Col ${col + 1}, Word ${item.word}`
      : `Row ${row + 1}, Col ${col + 1}, ${item.number} ${item.word}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      aria-label={ariaLabel}
      className={`relative flex items-center justify-center aspect-square rounded-2xl transition-all select-none p-1 sm:p-2 overflow-hidden ${cellClass}`}
    >
      {content}
    </button>
  );
};

