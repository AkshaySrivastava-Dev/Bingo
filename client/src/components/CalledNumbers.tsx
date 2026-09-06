import React, { useState } from 'react';
import { Grid, X } from 'lucide-react';

interface CalledNumbersProps {
  calledNumbers: number[];
}

export const CalledNumbers: React.FC<CalledNumbersProps> = ({ calledNumbers }) => {
  const [showMasterBoard, setShowMasterBoard] = useState(false);

  const getColColor = (num: number) => {
    if (num <= 15) return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
    if (num <= 30) return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    if (num <= 45) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (num <= 60) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  };

  const getColLetter = (num: number) => {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  };

  // Recent called numbers in reverse order (most recent first)
  const recent = [...calledNumbers].reverse().slice(0, 7);

  return (
    <div className="w-full bg-[#0E1526]/80 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
            Recent Numbers
          </span>
          <span className="text-xs font-semibold text-slate-500">
            ({calledNumbers.length}/75)
          </span>
        </div>

        <button
          onClick={() => setShowMasterBoard(true)}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors p-1 rounded-lg hover:bg-indigo-500/10"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Master Board</span>
        </button>
      </div>

      {/* Recent Numbers Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {recent.length > 0 ? (
          recent.map((num, i) => (
            <div
              key={`${num}-${i}`}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shadow-sm animate-pop-in ${getColColor(
                num
              )} ${i === 0 ? 'scale-105 border-indigo-400 font-extrabold' : 'opacity-80'}`}
            >
              <span className="text-[10px] opacity-75">{getColLetter(num)}</span>
              <span className="text-sm">{num}</span>
            </div>
          ))
        ) : (
          <span className="text-xs text-slate-500 py-1">No numbers called yet</span>
        )}
      </div>

      {/* Full 1-75 Master Board Modal */}
      {showMasterBoard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl max-w-xl w-full p-4 sm:p-5 shadow-2xl animate-pop-in max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 sticky top-0 bg-[#0F172A] z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Called Numbers Master Board</h3>
                <p className="text-xs text-slate-400">
                  {calledNumbers.length} of 75 numbers called so far
                </p>
              </div>
              <button
                onClick={() => setShowMasterBoard(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5 Column Grid (B 1-15, I 16-30, N 31-45, G 46-60, O 61-75) */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { letter: 'B', min: 1, max: 15, colBg: 'text-pink-400 border-pink-500/30' },
                { letter: 'I', min: 16, max: 30, colBg: 'text-sky-400 border-sky-500/30' },
                { letter: 'N', min: 31, max: 45, colBg: 'text-amber-400 border-amber-500/30' },
                { letter: 'G', min: 46, max: 60, colBg: 'text-emerald-400 border-emerald-500/30' },
                { letter: 'O', min: 61, max: 75, colBg: 'text-purple-400 border-purple-500/30' },
              ].map((col) => (
                <div key={col.letter} className="flex flex-col gap-1.5">
                  <div
                    className={`text-center font-black text-sm py-1 rounded-lg border bg-slate-900 ${col.colBg}`}
                  >
                    {col.letter}
                  </div>
                  <div className="flex flex-col gap-1">
                    {Array.from({ length: col.max - col.min + 1 }, (_, i) => col.min + i).map(
                      (num) => {
                        const isCalled = calledNumbers.includes(num);
                        return (
                          <div
                            key={num}
                            className={`text-center py-1 rounded text-xs font-bold transition-all ${
                              isCalled
                                ? `${getColColor(num)} shadow-sm`
                                : 'bg-slate-900/60 text-slate-600 border border-slate-800/40'
                            }`}
                          >
                            {num}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowMasterBoard(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
