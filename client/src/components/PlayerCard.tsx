import React from 'react';
import { Crown, WifiOff, CheckCircle, Clock } from 'lucide-react';

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
      className={`relative flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
        isMe
          ? 'bg-indigo-950/30 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
          : 'bg-[#0E1526]/80 border-slate-800'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${avatarColor} flex items-center justify-center text-white font-black text-base shadow-md`}
        >
          {initials}
        </div>
        {/* Connection status indicator dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
            isConnected ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      {/* Info & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-bold text-sm sm:text-base text-slate-100 truncate">
            {name}
          </span>
          {isMe && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              YOU
            </span>
          )}
          {isHost && (
            <span className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Crown className="w-2.5 h-2.5" />
              HOST
            </span>
          )}
          {completedLines > 0 && isPlaying && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {completedLines} {completedLines === 1 ? 'Line' : 'Lines'}
            </span>
          )}
        </div>

        {isPlaying ? (
          /* Live Game Progress Bar */
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400 text-[11px]">Best Line:</span>
              <span className="text-indigo-300 font-mono text-[11px]">{bestLineCount}/5</span>
            </div>
            {/* 5-segment Progress bar */}
            <div className="grid grid-cols-5 gap-1 h-2 bg-slate-900 rounded-full p-0.5 border border-slate-800">
              {[1, 2, 3, 4, 5].map((segment) => {
                const filled = segment <= bestLineCount;
                return (
                  <div
                    key={segment}
                    className={`rounded-full transition-all duration-300 ${
                      filled
                        ? segment === 5
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                          : 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Lobby Ready / Waiting status */
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {isReady ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" /> Not Ready
              </span>
            )}
            {!isConnected && (
              <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
