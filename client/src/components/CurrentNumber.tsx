import React from 'react';
import type { MoveRecord, GameMode } from '../types/game';
import { Radio, CheckCircle2, XCircle } from 'lucide-react';

interface CurrentNumberProps {
  lastMove: MoveRecord | null;
  mode: GameMode;
  activePlayerName: string;
  isMyTurn: boolean;
  totalCalls: number;
}

export const CurrentNumber: React.FC<CurrentNumberProps> = ({
  lastMove,
  mode,
  activePlayerName,
  isMyTurn,
  totalCalls,
}) => {
  const item = lastMove?.item;

  const renderVisual = () => {
    if (!item) {
      return (
        <div className="w-24 h-24 rounded-full bg-[#12141A] border-2 border-dashed border-[#313644] flex flex-col items-center justify-center text-[#A8A296] text-center p-2">
          <Radio className="w-5 h-5 text-[#F59E0B] mb-1 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            {isMyTurn ? 'Your Pick' : 'Awaiting Pick'}
          </span>
        </div>
      );
    }

    if (mode === 'NUMBERS_ONLY') {
      return (
        <div
          key={item.id}
          className="relative w-28 h-28 rounded-full bg-gradient-to-b from-[#FFFDF9] via-[#F4EFE6] to-[#D5CDC0] border-2 border-[#E8E2D5] shadow-[0_8px_20px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center animate-ball-pop select-none"
        >
          {/* Specular Highlight Arc */}
          <div className="absolute top-2.5 left-4 w-10 h-5 rounded-full bg-white/70 blur-[1px] transform -rotate-15 pointer-events-none" />

          {/* Top Label */}
          <div className="absolute top-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#D97706] to-[#92400E] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
            NUM
          </div>

          {/* Inner Bold Numeral */}
          <span className="text-4xl font-black tracking-tight leading-none text-[#1A1D24] font-mono mt-3 drop-shadow-sm">
            {item.number}
          </span>
        </div>
      );
    }

    if (mode === 'WORDS_ONLY') {
      return (
        <div
          key={item.id}
          className="relative px-6 py-4 min-w-[180px] rounded-2xl bg-gradient-to-b from-[#2B303C] to-[#1A1D24] border-2 border-[#F59E0B] shadow-[0_6px_0_#92400E] flex flex-col items-center justify-center animate-ball-pop select-none"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-[#F59E0B] mb-1">
            PARLOR WORD
          </span>
          <span className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[#F4EFE6] text-center drop-shadow">
            {item.word}
          </span>
        </div>
      );
    }

    // NUMBERS_AND_WORDS
    return (
      <div
        key={item.id}
        className="relative px-6 py-3 min-w-[190px] rounded-2xl bg-gradient-to-b from-[#2B303C] to-[#1A1D24] border-2 border-[#F59E0B] shadow-[0_6px_0_#92400E] flex flex-col items-center justify-center animate-ball-pop select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black font-mono text-[#F59E0B] leading-none">
            {item.number}
          </span>
          <div className="h-6 w-[2px] bg-[#363C4C]" />
          <span className="text-lg font-black uppercase tracking-wider text-[#F4EFE6] leading-none">
            {item.word}
          </span>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest text-[#A8A296] mt-1.5">
          EXACT PAIR
        </span>
      </div>
    );
  };

  const formatItemText = () => {
    if (!item) return '';
    if (mode === 'NUMBERS_ONLY') return `${item.number}`;
    if (mode === 'WORDS_ONLY') return `${item.word}`;
    return `${item.number} ${item.word}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-5 bg-[#1A1D24] border border-[#313644] rounded-3xl shadow-xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-widest font-black text-[#A8A296]">
            Latest Move
          </span>
          {lastMove && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]"></span>
            </span>
          )}
        </div>
        <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-[#12141A] text-[#F59E0B] border border-[#313644]">
          {totalCalls} Moves
        </span>
      </div>

      {/* Visual Tile / Ball Area */}
      <div className="h-32 flex items-center justify-center">
        {renderVisual()}
      </div>

      {/* Status & Match Info */}
      <div className="mt-2 flex flex-col items-center justify-center text-center space-y-1">
        {lastMove ? (
          <>
            <div className="flex items-center gap-1 text-xs font-bold text-[#A8A296]">
              <span>{lastMove.selectedByName} picked</span>
              <span className="text-[#F4EFE6] font-mono font-black">{formatItemText()}</span>
            </div>
            {lastMove.markedOnOpponent ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched & auto-marked on opponent's board
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A8A296]">
                <XCircle className="w-3.5 h-3.5 text-rose-400/80" /> Not found on opponent's board
              </span>
            )}
          </>
        ) : (
          <span className="text-xs font-semibold text-[#A8A296]">
            {isMyTurn ? '🎯 Select any tile on your board to start' : `⏳ ${activePlayerName} is choosing a tile`}
          </span>
        )}
      </div>
    </div>
  );
};


