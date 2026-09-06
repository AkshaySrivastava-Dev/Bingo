import React, { useState } from 'react';
import type { ConnectionStatus } from '../types/game';
import { sound } from '../utils/audio';
import { copyToClipboard } from '../utils/clipboard';
import { Volume2, VolumeX, Copy, Check, Share2, LogOut, Sparkles } from 'lucide-react';

interface HeaderProps {
  roomCode?: string;
  round?: number;
  connectionStatus: ConnectionStatus;
  onLeaveRoom?: () => void;
  onShowToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  round,
  connectionStatus,
  onLeaveRoom,
  onShowToast,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    onShowToast(nextMuted ? 'Sound muted' : 'Sound unmuted', 'info');
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    const ok = await copyToClipboard(roomCode);
    if (ok) {
      setCopiedCode(true);
      onShowToast(`Room code ${roomCode} copied!`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      onShowToast('Could not copy room code.', 'error');
    }
  };

  const handleCopyInviteLink = async () => {
    if (!roomCode) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    const ok = await copyToClipboard(inviteUrl);
    if (ok) {
      setCopiedLink(true);
      onShowToast('Invite link copied! Send it to your friend.', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      onShowToast('Could not copy invite link.', 'error');
    }
  };

  return (
    <header className="w-full bg-[#0E1424]/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-4 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                BINGO
              </span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                1v1
              </span>
            </div>
          </div>
        </div>

        {/* Center / Room Details if inside room */}
        {roomCode && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm">
              <span className="hidden sm:inline text-xs text-slate-400 mr-1.5 font-medium">Room:</span>
              <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-indigo-300">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="ml-1 sm:ml-2 p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>
            </div>

            <button
              onClick={handleCopyInviteLink}
              className="hidden sm:flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Invite'}</span>
            </button>

            {round && round > 1 && (
              <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                R{round}
              </span>
            )}
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : connectionStatus === 'reconnecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden md:inline text-slate-300 capitalize text-[11px]">
              {connectionStatus === 'connected'
                ? 'Online'
                : connectionStatus === 'reconnecting'
                ? 'Reconnecting'
                : 'Offline'}
            </span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Leave Room if in room */}
          {onLeaveRoom && roomCode && (
            <button
              onClick={onLeaveRoom}
              className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors"
              title="Leave Room"
              aria-label="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
