import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { WinnerInfo, PublicPlayerInfo } from '../types/game';
import { Trophy, RotateCcw, LogOut, CheckCircle2, Award, Sparkles } from 'lucide-react';

interface WinnerModalProps {
  winner: WinnerInfo | null;
  me: {
    id: string;
    name: string;
    rematchRequested: boolean;
  };
  opponent: PublicPlayerInfo | null;
  onRequestRematch: () => void;
  onLeaveRoom: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  me,
  opponent,
  onRequestRematch,
  onLeaveRoom,
}) => {
  if (!winner) return null;

  const isMeWinner = winner.playerId === me.id;

  useEffect(() => {
    // Fire celebratory confetti bursts
    const count = 200;
    const defaults = { origin: { y: 0.65 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [winner]);

  // Rematch consensus count
  const myRematch = me.rematchRequested;
  const opponentRematch = opponent?.rematchRequested ?? false;
  const rematchCount = (myRematch ? 1 : 0) + (opponentRematch ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1A1D24] border-2 border-[#D97706]/50 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Trophy Icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-[#F59E0B] to-[#D97706] shadow-[0_4px_0_#92400E] mb-4">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-[#12141A] stroke-[2.5]" />
        </div>

        {/* Title */}
        <div className="space-y-1 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D97706]/15 border border-[#D97706]/35 text-[#F59E0B] text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isMeWinner ? 'VICTORY!' : 'GAME OVER'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#F4EFE6] tracking-tight">
            {isMeWinner ? 'YOU GOT BINGO!' : `${winner.playerName} WON!`}
          </h2>

          <p className="text-sm font-bold text-[#A8A296]">
            Completed <span className="text-[#F59E0B] font-black">{winner.winningPattern.name}</span>
          </p>
        </div>

        {/* Winning Numbers Pill */}
        {winner.winningNumbers && winner.winningNumbers.length > 0 && (
          <div className="bg-[#12141A] border border-[#313644] rounded-2xl p-3.5 mb-5">
            <span className="text-[10px] font-black text-[#A8A296] block mb-1.5 uppercase tracking-widest">
              Winning Line Numbers
            </span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {winner.winningNumbers.map((num, i) => (
                <span
                  key={i}
                  className="w-9 h-9 rounded-xl bg-[#D97706]/20 border border-[#D97706]/40 text-[#F59E0B] font-black text-xs font-mono flex items-center justify-center shadow-sm"
                >
                  {num === 0 ? 'FREE' : num}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rematch Status Box */}
        <div className="mb-5 py-2 px-3 rounded-xl bg-[#12141A] border border-[#313644] text-xs font-bold text-[#A8A296] flex items-center justify-center gap-2">
          <Award className="w-4 h-4 text-[#F59E0B]" />
          <span>
            Rematch votes: <strong className="text-[#F4EFE6] font-mono">{rematchCount}/2</strong> players ready
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onRequestRematch}
            disabled={myRematch}
            className={`w-full py-4 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              myRematch
                ? 'bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 cursor-default'
                : 'btn-game-emerald'
            }`}
          >
            {myRematch ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Waiting for {opponent?.name || 'opponent'}...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-5 h-5" />
                <span>PLAY AGAIN</span>
              </>
            )}
          </button>

          <button
            onClick={onLeaveRoom}
            className="w-full py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm text-[#A8A296] hover:text-[#F4EFE6] btn-game-neutral flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};

