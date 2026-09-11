import React, { useState } from 'react';
import type { MoveRecord, GameMode } from '../types/game';
import { History, X, Check, Minus } from 'lucide-react';

interface CalledNumbersProps {
  playHistory: MoveRecord[];
  mode: GameMode;
}

export const CalledNumbers: React.FC<CalledNumbersProps> = ({
  playHistory,
  mode,
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Recent moves in reverse order (most recent first)
  const recentMoves = [...playHistory].reverse().slice(0, 8);

  const formatMoveText = (move: MoveRecord) => {
    if (mode === 'NUMBERS_ONLY') return `${move.item.number}`;
    if (mode === 'WORDS_ONLY') return `${move.item.word}`;
    return `#${move.item.number} ${move.item.word}`;
  };

  return (
    <div className="w-full bg-[#1A1D24] border border-[#313644] rounded-3xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest font-black text-[#A8A296]">
            Move History
          </span>
          <span className="text-xs font-mono font-bold text-[#A8A296]">
            ({playHistory.length} moves)
          </span>
        </div>

        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center gap-1.5 text-xs font-black text-[#F59E0B] hover:text-[#F4EFE6] transition-colors px-2.5 py-1 rounded-xl bg-[#12141A] hover:bg-[#2B303C] border border-[#313644] cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>All Moves</span>
        </button>
      </div>

      {/* Recent Moves Horizontal Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {recentMoves.length > 0 ? (
          recentMoves.map((move, i) => (
            <div
              key={`${move.item.id}-${move.timestamp}-${i}`}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shadow-sm ${
                i === 0
                  ? 'bg-[#D97706]/20 border-[#F59E0B] text-[#F4EFE6] scale-105'
                  : 'bg-[#12141A] border-[#2B303C] text-[#B8B2A7] opacity-85'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wide opacity-75 font-semibold">
                {move.selectedByName.slice(0, 5)}:
              </span>
              <span className="font-mono text-sm text-[#F59E0B]">{formatMoveText(move)}</span>
              {move.markedOnOpponent ? (
                <span
                  title="Matched opponent board"
                  className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              ) : (
                <span
                  title="Not on opponent board"
                  className="w-3.5 h-3.5 rounded-full bg-[#2B303C] text-[#71717A] flex items-center justify-center"
                >
                  <Minus className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </div>
          ))
        ) : (
          <span className="text-xs text-[#A8A296] py-1 font-medium">No moves played yet</span>
        )}
      </div>

      {/* Full Move History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D24] border border-[#313644] rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B303C] mb-4">
              <div>
                <h3 className="text-lg font-black text-[#F4EFE6]">Match Move Log</h3>
                <p className="text-xs text-[#A8A296] font-medium">
                  Complete chronological list of selections ({playHistory.length} total)
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl bg-[#12141A] hover:bg-[#2B303C] border border-[#313644] text-[#A8A296] hover:text-[#F4EFE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {playHistory.length === 0 ? (
                <p className="text-center text-sm text-[#A8A296] py-8">No moves recorded yet.</p>
              ) : (
                playHistory.map((m, idx) => (
                  <div
                    key={`${m.item.id}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#12141A] border border-[#2B303C]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#222630] border border-[#313644] text-[11px] font-mono font-black text-[#A8A296] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-[#F4EFE6]">{m.selectedByName}</span>
                        <div className="text-[11px] text-[#A8A296]">
                          {m.markedOnOpponent ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Auto-marked on opponent
                            </span>
                          ) : (
                            <span className="text-[#A8A296]">Unique to selector</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-[#222630] border border-[#363C4C] text-[#F59E0B] font-mono font-black text-sm">
                      {formatMoveText(m)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#2B303C] flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2.5 rounded-xl btn-game-neutral font-black text-xs cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


