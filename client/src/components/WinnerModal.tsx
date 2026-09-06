import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { WinnerInfo, PublicPlayerInfo } from '../types/game';
import { Trophy, RotateCcw, LogOut, CheckCircle2, Award } from 'lucide-react';

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
    const defaults = { origin: { y: 0.7 } };

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

  // Rematch status count
  const myRematch = me.rematchRequested;
  const opponentRematch = opponent?.rematchRequested ?? false;
  const rematchCount = (myRematch ? 1 : 0) + (opponentRematch ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0E1528] border border-slate-700/80 rounded-3xl max-w-md w-full p-5 sm:p-8 text-center shadow-2xl animate-pop-in relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_35px_rgba(245,158,11,0.5)] mb-4 animate-bounce">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950 stroke-[2.5]" />
        </div>

        {/* Title */}
        <div className="space-y-1 mb-4">
          <span className="text-xs uppercase tracking-widest font-black text-amber-400">
            {isMeWinner ? 'VICTORY!' : 'GAME OVER'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {isMeWinner ? 'YOU GOT BINGO!' : `${winner.playerName} WON!`}
          </h2>
          <p className="text-sm font-medium text-slate-400">
            Completed <span className="text-amber-300 font-bold">{winner.winningPattern.name}</span>
          </p>
        </div>

        {/* Winning Numbers Pill */}
        {winner.winningNumbers && winner.winningNumbers.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-6">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Winning Line Numbers
            </span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {winner.winningNumbers.map((num, i) => (
                <span
                  key={i}
                  className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center"
                >
                  {num === 0 ? 'FREE' : num}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rematch Status Box */}
        <div className="mb-6 py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-300 flex items-center justify-center gap-2">
          <Award className="w-4 h-4 text-indigo-400" />
          <span>
            Rematch votes: <strong className="text-white">{rematchCount}/2</strong> players ready
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onRequestRematch}
            disabled={myRematch}
            className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
              myRematch
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
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
                <span>Play Again</span>
              </>
            )}
          </button>

          <button
            onClick={onLeaveRoom}
            className="w-full py-3 px-5 rounded-2xl font-semibold text-sm text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
