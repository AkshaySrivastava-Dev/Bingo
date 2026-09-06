import React, { useState } from 'react';
import type { ClientGameState } from '../types/game';
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
} from 'lucide-react';

interface LobbyProps {
  gameState: ClientGameState;
  onSetReady: (isReady: boolean) => void;
  onStartCountdown: () => void;
  onShowToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  gameState,
  onSetReady,
  onStartCountdown,
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { room, me, opponent } = gameState;
  const isBothPresent = Boolean(opponent);
  const isBothReady = me.isReady && (opponent?.isReady ?? false);

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

  // Determine Start button disabled reason
  let startDisabledReason = '';
  if (!isBothPresent) {
    startDisabledReason = 'Waiting for friend to join...';
  } else if (!isBothReady) {
    startDisabledReason = 'Both players must click Ready';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 sm:py-6 space-y-5 sm:space-y-6">
      {/* Top Banner: Room Code & Share Invite */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900/80 to-purple-950/70 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left space-y-1 w-full md:w-auto">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
            Private Game Lobby
          </span>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider font-mono">
              {room.code}
            </h2>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Share this code or invite link with your friend to play.
          </p>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleCopyLink}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Players & Controls, Right is Board Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Players & Ready Status (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0E1526]/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Players in Room</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {isBothPresent ? '2/2' : '1/2'}
                </span>
              </h3>
              <span className="text-xs font-medium text-slate-400">
                {isBothReady ? 'Both Ready!' : isBothPresent ? 'Waiting for Ready...' : 'Waiting for Player 2'}
              </span>
            </div>

            {/* Players list */}
            <div className="space-y-3">
              {/* My Player Card */}
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

              {/* Opponent Card or Waiting Placeholder */}
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
                <div className="p-5 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-center gap-2 animate-pulse-subtle">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">Waiting for your friend to join...</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Send them the invite link to join this room.</p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="mt-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    + Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* Ready Toggle Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => onSetReady(!me.isReady)}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  me.isReady
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {me.isReady ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>You are READY! (Click to cancel)</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>I'm Ready! Click here</span>
                  </>
                )}
              </button>
            </div>

            {/* Host Start Game Controls */}
            {me.isHost && (
              <div className="pt-2 space-y-2">
                <button
                  onClick={onStartCountdown}
                  disabled={!isBothReady}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                    isBothReady
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Game</span>
                </button>

                {!isBothReady && (
                  <p className="text-center text-xs font-semibold text-amber-400/90">
                    ⚠️ {startDisabledReason}
                  </p>
                )}
              </div>
            )}

            {!me.isHost && (
              <div className="pt-2 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  {isBothReady
                    ? 'Waiting for Host to press Start Game...'
                    : 'Get ready so the Host can start the game!'}
                </p>
              </div>
            )}
          </div>

          {/* Fair Play & Rules summary */}
          <div className="bg-[#0E1526]/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Standard 5x5 Bingo Rules</span>
            </div>
            <p>
              &bull; Numbers 1-75 are automatically called every 4 seconds.
            </p>
            <p>
              &bull; Complete any 5-in-a-row (Horizontal, Vertical, or Diagonal) to achieve BINGO!
            </p>
          </div>
        </div>

        {/* Right Side: Your Randomized Lucky Board Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Your Game Board Preview
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Pre-generated</span>
          </div>

          <BingoBoard
            board={me.board}
            markedCells={me.markedCells}
            calledNumbers={[]}
            winningPattern={null}
            isGameActive={false}
            onCellClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
