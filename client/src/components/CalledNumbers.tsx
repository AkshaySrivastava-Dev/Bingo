import React, { useState } from 'react';
import { Grid, X } from 'lucide-react';

interface CalledNumbersProps {
  calledNumbers: number[];
}

export const CalledNumbers: React.FC<CalledNumbersProps> = ({ calledNumbers }) => {
  const [showMasterBoard, setShowMasterBoard] = useState(false);

  const getColColor = (num: number) => {
    if (num <= 15) return 'bg-[#E11D48]/15 text-[#FB7185] border-[#E11D48]/30';
    if (num <= 30) return 'bg-[#D97706]/15 text-[#F59E0B] border-[#D97706]/30';
    if (num <= 45) return 'bg-[#059669]/15 text-[#34D399] border-[#059669]/30';
    if (num <= 60) return 'bg-[#EA580C]/15 text-[#FB923C] border-[#EA580C]/30';
    return 'bg-[#7C3AED]/15 text-[#C084FC] border-[#7C3AED]/30';
  };

  const getColLetter = (num: number) => {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  };

  // Recent called numbers in reverse order (most recent first)
  const recent = [...calledNumbers].reverse().slice(0, 8);
  const currentNum = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;

  return (
    <div className="w-full bg-[#1A1D24] border border-[#313644] rounded-3xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest font-black text-[#A8A296]">
            Drawn History
          </span>
          <span className="text-xs font-mono font-bold text-[#A8A296]">
            ({calledNumbers.length}/75)
          </span>
        </div>

        <button
          onClick={() => setShowMasterBoard(true)}
          className="flex items-center gap-1.5 text-xs font-black text-[#F59E0B] hover:text-[#F4EFE6] transition-colors px-2.5 py-1 rounded-xl bg-[#12141A] hover:bg-[#2B303C] border border-[#313644] cursor-pointer"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Caller Board</span>
        </button>
      </div>

      {/* Recent Numbers Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {recent.length > 0 ? (
          recent.map((num, i) => (
            <div
              key={`${num}-${i}`}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shadow-sm ${getColColor(
                num
              )} ${i === 0 ? 'scale-105 border-[#F59E0B] font-black' : 'opacity-85'}`}
            >
              <span className="text-[10px] opacity-75">{getColLetter(num)}</span>
              <span className="text-sm font-mono">{num}</span>
            </div>
          ))
        ) : (
          <span className="text-xs text-[#A8A296] py-1 font-medium">No numbers drawn yet</span>
        )}
      </div>

      {/* Full 1-75 Master Board Modal */}
      {showMasterBoard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D24] border border-[#313644] rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B303C] mb-4 sticky top-0 bg-[#1A1D24] z-10">
              <div>
                <h3 className="text-lg font-black text-[#F4EFE6]">Full 1–75 Caller Board</h3>
                <p className="text-xs text-[#A8A296] font-medium">
                  {calledNumbers.length} of 75 balls drawn so far
                </p>
              </div>
              <button
                onClick={() => setShowMasterBoard(false)}
                className="p-1.5 rounded-xl bg-[#12141A] hover:bg-[#2B303C] border border-[#313644] text-[#A8A296] hover:text-[#F4EFE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5 Column Grid */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { letter: 'B', min: 1, max: 15, colBg: 'text-[#FB7185] border-[#E11D48]/30 bg-[#E11D48]/10' },
                { letter: 'I', min: 16, max: 30, colBg: 'text-[#F59E0B] border-[#D97706]/30 bg-[#D97706]/10' },
                { letter: 'N', min: 31, max: 45, colBg: 'text-[#34D399] border-[#059669]/30 bg-[#059669]/10' },
                { letter: 'G', min: 46, max: 60, colBg: 'text-[#FB923C] border-[#EA580C]/30 bg-[#EA580C]/10' },
                { letter: 'O', min: 61, max: 75, colBg: 'text-[#C084FC] border-[#7C3AED]/30 bg-[#7C3AED]/10' },
              ].map((col) => (
                <div key={col.letter} className="flex flex-col gap-1.5">
                  <div
                    className={`text-center font-black text-sm py-1.5 rounded-xl border ${col.colBg}`}
                  >
                    {col.letter}
                  </div>
                  <div className="flex flex-col gap-1">
                    {Array.from({ length: col.max - col.min + 1 }, (_, i) => col.min + i).map(
                      (num) => {
                        const isCalled = calledNumbers.includes(num);
                        const isCurrent = num === currentNum;
                        return (
                          <div
                            key={num}
                            className={`text-center py-1 rounded-lg text-xs font-mono font-black transition-all ${
                              isCurrent
                                ? 'bg-[#D97706] text-[#12141A] border-2 border-[#FCD34D] shadow-md font-black'
                                : isCalled
                                ? `${getColColor(num)} shadow-sm`
                                : 'bg-[#12141A] text-[#555A68] border border-[#232732]'
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
                className="px-5 py-2.5 rounded-xl btn-game-neutral font-black text-xs cursor-pointer"
              >
                Close Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

