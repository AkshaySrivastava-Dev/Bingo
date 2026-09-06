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
        gradient: 'from-pink-500 via-rose-500 to-pink-700',
        border: 'border-pink-400',
        glow: 'shadow-[0_0_35px_rgba(236,72,153,0.5)]',
        badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      };
    }
    if (num >= 16 && num <= 30) {
      return {
        letter: 'I',
        gradient: 'from-sky-500 via-cyan-500 to-blue-600',
        border: 'border-sky-400',
        glow: 'shadow-[0_0_35px_rgba(56,189,248,0.5)]',
        badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      };
    }
    if (num >= 31 && num <= 45) {
      return {
        letter: 'N',
        gradient: 'from-amber-400 via-amber-500 to-orange-600',
        border: 'border-amber-300',
        glow: 'shadow-[0_0_35px_rgba(245,158,11,0.5)]',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    }
    if (num >= 46 && num <= 60) {
      return {
        letter: 'G',
        gradient: 'from-emerald-400 via-emerald-500 to-teal-700',
        border: 'border-emerald-300',
        glow: 'shadow-[0_0_35px_rgba(16,185,129,0.5)]',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    }
    return {
      letter: 'O',
      gradient: 'from-purple-500 via-violet-600 to-indigo-700',
      border: 'border-purple-400',
      glow: 'shadow-[0_0_35px_rgba(139,92,246,0.5)]',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    };
  };

  const theme = currentNumber ? getLetterAndTheme(currentNumber) : null;

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0E1526]/80 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between w-full max-w-xs mb-3">
        <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
          Current Call
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {totalCalled}/75 Called
        </span>
      </div>

      {currentNumber && theme ? (
        <div className="flex flex-col items-center">
          {/* Animated Bingo Ball */}
          <div
            key={currentNumber}
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br ${theme.gradient} border-4 ${theme.border} ${theme.glow} flex flex-col items-center justify-center animate-ball-drop select-none`}
          >
            {/* Glossy overlay reflection */}
            <div className="absolute top-2 left-4 w-12 h-6 rounded-full bg-white/30 blur-[2px] transform -rotate-12 pointer-events-none" />

            <span className="text-sm font-black text-white/90 tracking-widest uppercase mb-[-2px]">
              {theme.letter}
            </span>
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
              {currentNumber}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`text-sm font-bold px-3 py-1 rounded-xl border ${theme.badgeBg}`}
            >
              Column {theme.letter} &bull; {currentNumber}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
          <span className="text-xs font-bold uppercase tracking-wider animate-pulse text-center px-2">
            Waiting for next number...
          </span>
        </div>
      )}
    </div>
  );
};
