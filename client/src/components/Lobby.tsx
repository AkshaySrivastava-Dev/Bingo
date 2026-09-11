import React, { useState } from 'react';
import type { ClientGameState, GameMode } from '../types/game';
import { PlayerCard } from './PlayerCard';
import { BingoBoard } from './BingoBoard';
import { copyToClipboard } from '../utils/clipboard';
import {
  Share2,
  Copy,
  Check,
  Play,
  UserPlus,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Swords,
  Hash,
  Type,
  Layers,
  Lock,
} from 'lucide-react';

interface LobbyProps {
  gameState: ClientGameState;
  onSetReady: (isReady: boolean) => void;
  onStartCountdown: () => void;
  onSetGameMode: (mode: GameMode) => void;
  onShowToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface ModeCardConfig {
  mode: GameMode;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
}

const GAME_MODES: ModeCardConfig[] = [
  {
    mode: 'NUMBERS_ONLY',
    title: 'Numbers Only',
    subtitle: 'Classic 1–25 numbers on every board',
    badge: 'CLASSIC FAST',
    icon: Hash,
  },
  {
    mode: 'WORDS_ONLY',
    title: 'Words Only',
    subtitle: '25 themed parlor words from 80+ dictionary',
    badge: 'WORD BINGO',
    icon: Type,
  },
  {
    mode: 'NUMBERS_AND_WORDS',
    title: 'Numbers + Words',
    subtitle: '25 paired tiles with exact number & word match',
    badge: 'STRATEGIC',
    icon: Layers,
  },
];

export const Lobby: React.FC<LobbyProps> = ({
  gameState,
  onSetReady,
  onStartCountdown,
  onSetGameMode,
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { room, me, opponent } = gameState;
  const isBothPresent = Boolean(opponent);
  const isBothReady = me.isReady && (opponent?.isReady ?? false);
  const currentGameMode = room.mode || 'NUMBERS_ONLY';

  const handleCopyLink = async () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    const ok = await copyToClipboard(inviteUrl);
    if (ok) {
      setCopiedLink(true);
      onShowToast('Invite link copied! Share with your friend.', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      onShowToast('Failed to copy invite link.', 'error');
    }
  };

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(room.code);
    if (ok) {
      setCopiedCode(true);
      onShowToast(`Room code ${room.code} copied!`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      onShowToast('Failed to copy room code.', 'error');
    }
  };

  // Start button disabled status message
  let startDisabledReason = '';
  if (!isBothPresent) {
    startDisabledReason = 'Waiting for your friend to join...';
  } else if (!isBothReady) {
    startDisabledReason = 'Both players must click Ready to start';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Arena Banner */}
      <div className="bg-[#1A1D24] border border-[#313644] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#F59E0B] flex items-center justify-center md:justify-start gap-1.5">
              <Swords className="w-3.5 h-3.5" />
              Game Lobby
            </span>
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <span className="text-xs text-[#A8A296] font-bold uppercase tracking-wider">
                Room Code:
              </span>
              <span className="text-3xl font-black font-mono tracking-widest text-[#F59E0B]">
                {room.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-xl bg-[#12141A] hover:bg-[#2B303C] border border-[#313644] text-[#B8B2A7] hover:text-[#F4EFE6] transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-[#B8B2A7] font-medium">
              Share the invite link with your friend to connect instantly.
            </p>
          </div>

          {/* Share Action */}
          <div className="w-full md:w-auto">
            <button
              onClick={handleCopyLink}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl btn-game-amber text-sm font-black cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#12141A]" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Game Mode Selector Section */}
      <div className="bg-[#1A1D24] border border-[#313644] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#2B303C] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[#F4EFE6]">
              Select Game Mode
            </h3>
          </div>
          {me.isHost ? (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#D97706]/15 border border-[#D97706]/30 text-[#F59E0B]">
              👑 Host Chooses Mode
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#222630] border border-[#313644] text-[#A8A296] flex items-center gap-1">
              <Lock className="w-3 h-3" /> Host's Selection
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {GAME_MODES.map((config) => {
            const isSelected = currentGameMode === config.mode;
            const Icon = config.icon;

            return (
              <button
                key={config.mode}
                type="button"
                onClick={() => {
                  if (me.isHost) {
                    onSetGameMode(config.mode);
                  }
                }}
                disabled={!me.isHost}
                className={`relative flex flex-col p-4 rounded-2xl text-left border-2 transition-all ${
                  isSelected
                    ? 'bg-[#222630] border-[#F59E0B] shadow-[0_4px_0_#92400E] ring-1 ring-[#F59E0B]/50'
                    : me.isHost
                    ? 'bg-[#12141A] border-[#2B303C] hover:border-[#3E4556] hover:bg-[#1A1D24] opacity-80 hover:opacity-100 cursor-pointer shadow-[0_3px_0_#14171E]'
                    : 'bg-[#12141A] border-[#2B303C] opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#F59E0B] text-[#12141A]'
                        : 'bg-[#2B303C] text-[#A8A296]'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                        : 'bg-[#2B303C]/50 text-[#71717A]'
                    }`}
                  >
                    {config.badge}
                  </span>
                </div>

                <div className="font-black text-sm text-[#F4EFE6] mt-1">{config.title}</div>
                <div className="text-[11px] text-[#A8A296] leading-snug mt-1 font-medium">
                  {config.subtitle}
                </div>

                {isSelected && (
                  <div className="mt-3 pt-2 border-t border-[#363C4C] flex items-center gap-1.5 text-[10px] font-black text-[#F59E0B]">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> ACTIVE MODE
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left is Players Arena, Right is Lucky Board Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Players & Ready Matchup (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#1A1D24] border border-[#313644] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2B303C] pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#F4EFE6] flex items-center gap-2">
                <span>Player Matchup</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#12141A] border border-[#313644] text-[#A8A296]">
                  {isBothPresent ? '2/2 Ready' : '1/2 Waiting'}
                </span>
              </h3>
              <span className="text-xs font-bold text-[#F59E0B]">
                {isBothReady ? '🔥 Ready to Start!' : isBothPresent ? 'Waiting for Ready' : 'Waiting for Opponent'}
              </span>
            </div>

            {/* Players VS Arena */}
            <div className="space-y-3">
              {/* Player 1: Me */}
              <PlayerCard
                name={me.name}
                avatarColor={me.avatarColor}
                isHost={me.isHost}
                isReady={me.isReady}
                isConnected={me.isConnected}
                bestLineCount={me.bestLineCount}
                completedLines={me.completedLines}
                isMe={true}
                phase={room.phase}
              />

              {/* VS Divider Badge */}
              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2B303C]" />
                </div>
                <div className="relative px-3 py-1 bg-[#12141A] border border-[#313644] rounded-full text-[10px] font-black tracking-widest text-[#B8B2A7] uppercase shadow">
                  VS
                </div>
              </div>

              {/* Player 2: Opponent or Waiting Box */}
              {opponent ? (
                <PlayerCard
                  name={opponent.name}
                  avatarColor={opponent.avatarColor}
                  isHost={opponent.isHost}
                  isReady={opponent.isReady}
                  isConnected={opponent.isConnected}
                  bestLineCount={opponent.bestLineCount}
                  completedLines={opponent.completedLines}
                  isMe={false}
                  phase={room.phase}
                />
              ) : (
                <div className="p-6 rounded-2xl border-2 border-dashed border-[#313644] bg-[#12141A]/60 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#D97706]/15 border border-[#D97706]/30 flex items-center justify-center text-[#F59E0B]">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#F4EFE6]">Waiting for friend to join...</h4>
                    <p className="text-xs text-[#A8A296] mt-0.5">Send them the invite link to start playing.</p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="mt-2 text-xs font-black text-[#F59E0B] hover:underline underline-offset-4 cursor-pointer"
                  >
                    + Copy Invite Link
                  </button>
                </div>
              )}
            </div>

            {/* Ready Toggle Button */}
            <div className="pt-2 border-t border-[#2B303C]">
              <button
                onClick={() => onSetReady(!me.isReady)}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  me.isReady
                    ? 'btn-game-emerald'
                    : 'btn-game-neutral'
                }`}
              >
                {me.isReady ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                    <span>YOU ARE READY! (Click to cancel)</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-[#F59E0B]" />
                    <span>I'M READY — CLICK HERE</span>
                  </>
                )}
              </button>
            </div>

            {/* Host Start Game Action */}
            {me.isHost && (
              <div className="pt-2 space-y-2">
                <button
                  onClick={onStartCountdown}
                  disabled={!isBothReady}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all ${
                    isBothReady
                      ? 'btn-game-emerald shadow-lg cursor-pointer'
                      : 'bg-[#12141A] text-[#666B7A] border border-[#2B303C] cursor-not-allowed opacity-60'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>START GAME NOW</span>
                </button>

                {!isBothReady && (
                  <p className="text-center text-xs font-bold text-[#F59E0B]">
                    ⚠️ {startDisabledReason}
                  </p>
                )}
              </div>
            )}

            {!me.isHost && (
              <div className="pt-2 text-center">
                <p className="text-xs text-[#B8B2A7] font-medium">
                  {isBothReady
                    ? 'Waiting for Host to press Start Game...'
                    : 'Mark yourself Ready so the Host can start!'}
                </p>
              </div>
            )}
          </div>

          {/* Rules Card */}
          <div className="bg-[#1A1D24]/70 border border-[#2B303C] rounded-2xl p-4 text-xs text-[#A8A296] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#F4EFE6]">
              <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
              <span>Turn-Based 1v1 Fast Bingo Rules</span>
            </div>
            <p>&bull; Take turns selecting any unmarked tile on your own board.</p>
            <p>&bull; Your tile is marked immediately; matching opponent tiles are auto-marked!</p>
            <p>&bull; Complete any 1 line (Row, Column, or Diagonal) to win BINGO instantly!</p>
          </div>
        </div>

        {/* Right Side: Pre-game Lucky Board Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#F4EFE6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              Your Lucky Board Preview
            </span>
            <span className="text-[11px] font-bold text-[#A8A296]">All 25 Tiles</span>
          </div>

          <BingoBoard
            board={me.board}
            mode={currentGameMode}
            markedCells={me.markedCells}
            winningPattern={null}
            isGameActive={false}
            isMyTurn={false}
            onCellClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};


