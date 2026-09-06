import React, { useState } from 'react';
import type { ConnectionStatus } from '../types/game';
import { sound } from '../utils/audio';
import { copyToClipboard } from '../utils/clipboard';
import { BingoLogo } from './BingoLogo';
import { Volume2, VolumeX, Copy, Check, Share2, LogOut } from 'lucide-react';

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
      onShowToast('Invite link copied! Share with your friend.', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      onShowToast('Could not copy invite link.', 'error');
    }
  };

  return (
    <header className="w-full bg-[#161820]/95 border-b border-[#2B303C] backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <BingoLogo size="sm" showSubtitle={false} />

        {/* Center: Room Code badge if inside room */}
        {roomCode && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#20242E] border border-[#313745] rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-inner">
              <span className="hidden sm:inline text-[11px] text-[#A8A296] mr-1.5 font-bold uppercase tracking-wider">
                Room
              </span>
              <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-[#F59E0B]">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="ml-1.5 p-1 text-[#A8A296] hover:text-[#F4EFE6] rounded-lg hover:bg-[#2B303C] transition-colors"
                title="Copy Room Code"
                aria-label="Copy Room Code"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <button
              onClick={handleCopyInviteLink}
              className="hidden sm:flex items-center gap-1.5 bg-[#D97706]/15 hover:bg-[#D97706]/25 text-[#F59E0B] border border-[#D97706]/35 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Invite Friend'}</span>
            </button>

            {round && round > 1 && (
              <span className="hidden xs:inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#E11D48]/15 text-[#FB7185] border border-[#E11D48]/30">
                Round {round}
              </span>
            )}
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#20242E] border border-[#313745] text-xs font-semibold text-[#B8B2A7]">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400'
                  : connectionStatus === 'reconnecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden md:inline text-[11px] font-medium">
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'reconnecting'
                ? 'Reconnecting'
                : 'Offline'}
            </span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-[#20242E] hover:bg-[#2A2F3D] border border-[#313745] text-[#B8B2A7] hover:text-[#F4EFE6] transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#FB7185]" /> : <Volume2 className="w-4 h-4 text-[#F59E0B]" />}
          </button>

          {/* Leave Room Button */}
          {onLeaveRoom && roomCode && (
            <button
              onClick={onLeaveRoom}
              className="p-2 rounded-xl bg-[#E11D48]/10 hover:bg-[#E11D48]/20 border border-[#E11D48]/25 text-[#FB7185] hover:text-white transition-colors"
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

