import React from 'react';

interface CountdownOverlayProps {
  countdown: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ countdown }) => {
  if (countdown <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none select-none">
      <div className="text-center space-y-3">
        <span className="text-sm sm:text-base uppercase tracking-widest font-black text-[#F59E0B]">
          Game Starting In
        </span>
        <div
          key={countdown}
          className="text-8xl sm:text-9xl font-black text-[#F59E0B] drop-shadow-[0_8px_20px_rgba(217,119,6,0.5)] font-mono animate-ball-pop"
        >
          {countdown}
        </div>
        <p className="text-sm font-bold text-[#F4EFE6]">
          Get ready! Look at your numbers.
        </p>
      </div>
    </div>
  );
};

