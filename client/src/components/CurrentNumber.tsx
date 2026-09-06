import React from 'react';
import type { PendingNumber, MoveRecord, TurnState } from '../types/game';
import { Radio, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface CurrentNumberProps {
  pendingNumber: PendingNumber | null;
  lastMove: MoveRecord | null;
  turnState: TurnState;
  activePlayerName: string;
  isMyTurn: boolean;
  isPendingResponder: boolean;
  totalCalls: number;
}

export const CurrentNumber: React.FC<CurrentNumberProps> = ({
  pendingNumber,
  lastMove,
  turnState: _turnState,
  activePlayerName,
  isMyTurn,
  isPendingResponder,
  totalCalls,
}) => {
  const getLetterAndTheme = (num: number) => {
    if (num >= 1 && num <= 15) {
      return {
        letter: 'B',
        ballBg: 'from-[#E11D48] to-[#9F1239]',
        ring: 'border-[#FB7185]',
        badge: 'bg-[#E11D48]/15 text-[#FB7185] border-[#E11D48]/30',
        capColor: '#E11D48',
      };
    }
    if (num >= 16 && num <= 30) {
      return {
        letter: 'I',
        ballBg: 'from-[#D97706] to-[#92400E]',
        ring: 'border-[#FCD34D]',
        badge: 'bg-[#D97706]/15 text-[#F59E0B] border-[#D97706]/30',
        capColor: '#D97706',
      };
    }
    if (num >= 31 && num <= 45) {
      return {
        letter: 'N',
        ballBg: 'from-[#059669] to-[#065F46]',
        ring: 'border-[#6EE7B7]',
        badge: 'bg-[#059669]/15 text-[#34D399] border-[#059669]/30',
        capColor: '#059669',
      };
    }
    if (num >= 46 && num <= 60) {
      return {
        letter: 'G',
        ballBg: 'from-[#EA580C] to-[#9A3412]',
        ring: 'border-[#FDBA74]',
        badge: 'bg-[#EA580C]/15 text-[#FB923C] border-[#EA580C]/30',
        capColor: '#EA580C',
      };
    }
    return {
      letter: 'O',
      ballBg: 'from-[#7C3AED] to-[#5B21B6]',
      ring: 'border-[#D8B4FE]',
      badge: 'bg-[#7C3AED]/15 text-[#C084FC] border-[#7C3AED]/30',
      capColor: '#7C3AED',
    };
  };

  const activeNum = pendingNumber?.number ?? lastMove?.number ?? null;
  const theme = activeNum ? getLetterAndTheme(activeNum) : null;

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-5 bg-[#1A1D24] border border-[#313644] rounded-3xl shadow-xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-widest font-black text-[#A8A296]">
            {pendingNumber ? 'Pending Selection' : 'Latest Move'}
          </span>
          {pendingNumber && (
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

      {/* 3D Physical Bingo Ball */}
      <div className="h-32 flex items-center justify-center">
        {activeNum && theme ? (
          <div
            key={activeNum}
            className="relative w-28 h-28 rounded-full bg-gradient-to-b from-[#FFFDF9] via-[#F4EFE6] to-[#D5CDC0] border-2 border-[#E8E2D5] shadow-[0_8px_20px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center animate-ball-pop select-none"
          >
            {/* Specular Highlight Arc */}
            <div className="absolute top-2.5 left-4 w-10 h-5 rounded-full bg-white/70 blur-[1px] transform -rotate-15 pointer-events-none" />

            {/* Vintage Color Ring Badge */}
            <div
              className={`absolute top-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r ${theme.ballBg} text-white text-[10px] font-black uppercase tracking-wider shadow-sm`}
            >
              {theme.letter}
            </div>

            {/* Inner Bold Numeral */}
            <span className="text-4xl font-black tracking-tight leading-none text-[#1A1D24] font-mono mt-3 drop-shadow-sm">
              {activeNum}
            </span>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#12141A] border-2 border-dashed border-[#313644] flex flex-col items-center justify-center text-[#A8A296] text-center p-2">
            <Radio className="w-5 h-5 text-[#F59E0B] mb-1 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isMyTurn ? 'Your Pick' : 'Awaiting Pick'}
            </span>
          </div>
        )}
      </div>

      {/* Status & Subtitle Info */}
      <div className="mt-2 flex flex-col items-center justify-center text-center space-y-1">
        {pendingNumber ? (
          <>
            <div className="flex items-center gap-1 text-xs font-black text-[#F4EFE6]">
              <span>{pendingNumber.selectedByName} called</span>
              <span className="text-[#F59E0B] font-mono">{theme?.letter} {pendingNumber.number}</span>
            </div>
            {isPendingResponder ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40 animate-pulse">
                <Sparkles className="w-3 h-3" /> Found on your board! STAMP IT
              </span>
            ) : isMyTurn ? (
              <span className="text-[11px] font-semibold text-[#A8A296]">
                Waiting for opponent to check...
              </span>
            ) : null}
          </>
        ) : lastMove ? (
          <>
            <div className="flex items-center gap-1 text-xs font-bold text-[#A8A296]">
              <span>{lastMove.selectedByName} picked</span>
              <span className="text-[#F4EFE6] font-mono font-black">{lastMove.number}</span>
            </div>
            {lastMove.hasMatch ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched & stamped on opponent board
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A8A296]">
                <XCircle className="w-3.5 h-3.5 text-rose-400/80" /> Not on opponent board
              </span>
            )}
          </>
        ) : (
          <span className="text-xs font-semibold text-[#A8A296]">
            {isMyTurn ? '🎯 Select any number on your board to start' : `⏳ ${activePlayerName} is choosing a number`}
          </span>
        )}
      </div>
    </div>
  );
};

