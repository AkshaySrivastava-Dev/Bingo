import React from 'react';

interface BingoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BingoLogo: React.FC<BingoLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const markSize = isSm ? 'w-8 h-8' : isLg ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-10 h-10';
  const titleSize = isSm ? 'text-lg' : isLg ? 'text-4xl sm:text-5xl' : 'text-2xl';

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* 3D Bingo Ball Logo Mark */}
      <div className={`relative ${markSize} flex-shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Outer Ball Shadow & Sphere */}
          <circle cx="50" cy="50" r="46" fill="#E11D48" />
          {/* Specular Top-Left Highlight */}
          <ellipse cx="38" cy="30" rx="24" ry="14" fill="white" fillOpacity="0.22" transform="rotate(-20 38 30)" />
          {/* Inner Number Plate */}
          <circle cx="50" cy="50" r="27" fill="#FDFBF7" stroke="#313644" strokeWidth="2.5" />
          {/* Letter B */}
          <text
            x="50"
            y="59"
            fontFamily="Outfit, sans-serif"
            fontSize="28"
            fontWeight="900"
            fill="#1A1D24"
            textAnchor="middle"
          >
            B
          </text>
          {/* Top Vintage Ball Color Accent Strip */}
          <path d="M22 28 Q 50 18 78 28" fill="none" stroke="#BE123C" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSize} font-black tracking-tight text-[#F4EFE6]`}>
            BINGO
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40">
            LIVE
          </span>
        </div>
        {showSubtitle && isLg && (
          <span className="text-xs sm:text-sm font-medium text-[#B8B2A7] tracking-wide">
            Real-Time 1v1 Multiplayer
          </span>
        )}
      </div>
    </div>
  );
};
