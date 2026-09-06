import React from 'react';
import { Crown, WifiOff, CheckCircle2, Clock } from 'lucide-react';

interface PlayerCardProps {
  name: string;
  avatarColor: string;
  isHost: boolean;
  isReady?: boolean;
  isConnected: boolean;
  bestLineCount: number; // 0-5
  completedLines: number;
  isMe?: boolean;
  phase: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  avatarColor,
  isHost,
  isReady,
  isConnected,
  bestLineCount,
  completedLines,
  isMe = false,
  phase,
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isPlaying = phase === 'PLAYING' || phase === 'GAME_OVER';

  return (
    <div
      className={`relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all ${
        isMe
          ? 'bg-[#222630] border-[#D97706]/40 shadow-lg'
          : 'bg-[#1A1D24] border-[#313644]'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-white font-black text-base shadow-md border border-white/15`}
        >
          {initials}
        </div>
        {/* Connection status indicator dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1A1D24] ${
            isConnected ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* Info & Live Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="font-black text-sm sm:text-base text-[#F4EFE6] truncate">
            {name}
          </span>
          {isMe && (
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/35 uppercase tracking-widest">
              YOU
            </span>
          )}
          {isHost && (
            <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.2 rounded-md bg-[#E11D48]/20 text-[#FB7185] border border-[#E11D48]/30 uppercase tracking-widest">
              <Crown className="w-2.5 h-2.5 fill-[#FB7185]" />
              HOST
            </span>
          )}
          {completedLines > 0 && isPlaying && (
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-[#059669]/20 text-[#34D399] border border-[#059669]/30 uppercase tracking-wider">
              {completedLines} {completedLines === 1 ? 'Line' : 'Lines'}
            </span>
          )}
        </div>

        {isPlaying ? (
          /* Live Game Progress Bar */
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#A8A296] text-[10px] uppercase tracking-wider">
                Progress
              </span>
              <span className="text-[#F59E0B] font-mono text-[11px] font-black">
                {bestLineCount}/5 {bestLineCount === 4 ? '🔥 BINGO MATCH!' : ''}
              </span>
            </div>
            {/* 5-segment Progress bar */}
            <div className="grid grid-cols-5 gap-1.5 h-2.5 bg-[#12141A] rounded-full p-0.5 border border-[#2B303C]">
              {[1, 2, 3, 4, 5].map((segment) => {
                const filled = segment <= bestLineCount;
                return (
                  <div
                    key={segment}
                    className={`rounded-full transition-all duration-300 ${
                      filled
                        ? segment === 5
                          ? 'bg-[#E11D48]'
                          : 'bg-[#F59E0B]'
                        : 'bg-[#222630]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Lobby Ready / Waiting status */
          <div className="flex items-center gap-2 text-xs font-bold">
            {isReady ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Ready to Play
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#A8A296]">
                <Clock className="w-4 h-4 text-[#F59E0B]" /> Not Ready
              </span>
            )}
            {!isConnected && (
              <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                <WifiOff className="w-3.5 h-3.5" /> Disconnected
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

