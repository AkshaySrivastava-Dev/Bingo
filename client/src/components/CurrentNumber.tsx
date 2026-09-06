import React from 'react';

interface CurrentNumberProps {
  currentNumber: number | null;
  totalCalled: number;
}

export const CurrentNumber: React.FC<CurrentNumberProps> = ({ currentNumber, totalCalled }) => {
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

  const theme = currentNumber ? getLetterAndTheme(currentNumber) : null;

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-5 bg-[#1A1D24] border border-[#313644] rounded-3xl shadow-xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-[11px] uppercase tracking-widest font-black text-[#A8A296]">
          Current Number
        </span>
        <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-[#12141A] text-[#F59E0B] border border-[#313644]">
          {totalCalled}/75 Drawn
        </span>
      </div>

      {/* 3D Physical Bingo Ball */}
      <div className="h-32 flex items-center justify-center">
        {currentNumber && theme ? (
          <div
            key={currentNumber}
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
              {currentNumber}
            </span>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#12141A] border-2 border-dashed border-[#313644] flex flex-col items-center justify-center text-[#A8A296] text-center p-2">
            <span className="text-[10px] font-black uppercase tracking-wider animate-pulse">
              Drawing ball...
            </span>
          </div>
        )}
      </div>

      {/* Bottom Column Badge */}
      <div className="mt-2 flex items-center justify-center">
        {theme && currentNumber ? (
          <span className={`text-xs font-black px-3 py-1 rounded-xl border ${theme.badge}`}>
            Column {theme.letter} &bull; Number {currentNumber}
          </span>
        ) : (
          <span className="text-xs font-semibold text-[#A8A296]">
            Auto-called every 4 seconds
          </span>
        )}
      </div>
    </div>
  );
};

