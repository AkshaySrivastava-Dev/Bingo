import React from 'react';

interface CountdownOverlayProps {
  countdown: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ countdown }) => {
  if (countdown <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none select-none">
      <div className="text-center space-y-3 animate-pop-in">
        <span className="text-sm sm:text-base uppercase tracking-widest font-extrabold text-indigo-400">
          Game Starting In
        </span>
        <div
          key={countdown}
          className="text-8xl sm:text-9xl font-black bg-gradient-to-b from-white via-indigo-200 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(99,102,241,0.8)] animate-pop-in"
        >
          {countdown}
        </div>
        <p className="text-sm font-semibold text-slate-300">
          Get ready! Look at your numbers.
        </p>
      </div>
    </div>
  );
};
