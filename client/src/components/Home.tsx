import React, { useState, useEffect } from 'react';
import { Play, UserPlus, Sparkles, RefreshCw } from 'lucide-react';
import { BingoLogo } from './BingoLogo';

interface HomeProps {
  onCreateRoom: (playerName: string) => Promise<boolean>;
  onJoinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  isLoading: boolean;
  onShowToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const Home: React.FC<HomeProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Auto-fill room code if in URL (?room=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCode(roomParam.trim().toUpperCase());
      setMode('join');
    }
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      onShowToast('Please enter your name.', 'warning');
      return;
    }
    await onCreateRoom(createName.trim());
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) {
      onShowToast('Please enter your name.', 'warning');
      return;
    }
    if (!joinCode.trim()) {
      onShowToast('Please enter the 6-character room code.', 'warning');
      return;
    }
    await onJoinRoom(joinCode.trim().toUpperCase(), joinName.trim());
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col justify-center items-center px-4 py-8 overflow-hidden">
      {/* Subtle Vintage Decorative Ball Accents (Desktop only) */}
      <div className="hidden lg:flex absolute top-16 left-16 w-16 h-16 rounded-full bg-[#E11D48] shadow-lg border-2 border-[#BE123C] flex-col items-center justify-center text-[#FDFBF7] font-black select-none opacity-60">
        <span className="text-[9px] uppercase tracking-widest text-rose-200">B</span>
        <span className="text-xl leading-none">07</span>
      </div>

      <div className="hidden lg:flex absolute bottom-24 left-24 w-14 h-14 rounded-full bg-[#D97706] shadow-lg border-2 border-[#B45309] flex-col items-center justify-center text-[#FDFBF7] font-black select-none opacity-50">
        <span className="text-[8px] uppercase tracking-widest text-amber-200">I</span>
        <span className="text-lg leading-none">24</span>
      </div>

      <div className="hidden lg:flex absolute top-20 right-20 w-16 h-16 rounded-full bg-[#059669] shadow-lg border-2 border-[#047857] flex-col items-center justify-center text-[#FDFBF7] font-black select-none opacity-60">
        <span className="text-[9px] uppercase tracking-widest text-emerald-200">N</span>
        <span className="text-xl leading-none">41</span>
      </div>

      <div className="hidden lg:flex absolute bottom-20 right-28 w-14 h-14 rounded-full bg-[#7C3AED] shadow-lg border-2 border-[#6D28D9] flex-col items-center justify-center text-[#FDFBF7] font-black select-none opacity-50">
        <span className="text-[8px] uppercase tracking-widest text-purple-200">O</span>
        <span className="text-lg leading-none">71</span>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-md w-full space-y-6 text-center">
        {/* Brand Hero */}
        <div className="flex flex-col items-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D97706]/15 border border-[#D97706]/35 text-[#F59E0B] text-xs font-black tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2-Player Real-Time Duel</span>
          </div>

          <BingoLogo size="lg" showSubtitle={false} />

          <p className="text-sm sm:text-base text-[#B8B2A7] font-medium px-4">
            Play a quick game with a friend. Create a private room, share the link, and race to get 5 in a row!
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-[#1A1D24] border border-[#313644] rounded-3xl p-6 sm:p-7 shadow-xl relative">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#12141A] p-1.5 rounded-2xl border border-[#2B303C] mb-6">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
                mode === 'create'
                  ? 'bg-[#E11D48] text-white shadow-md'
                  : 'text-[#B8B2A7] hover:text-[#F4EFE6]'
              }`}
            >
              Create Game
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
                mode === 'join'
                  ? 'bg-[#D97706] text-[#12141A] shadow-md font-black'
                  : 'text-[#B8B2A7] hover:text-[#F4EFE6]'
              }`}
            >
              Join Game
            </button>
          </div>

          {/* Form: Create Room */}
          {mode === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#A8A296] mb-1.5">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Akshay"
                  maxLength={18}
                  disabled={isLoading}
                  autoFocus
                  className="w-full bg-[#12141A] border border-[#313644] rounded-2xl px-4 py-3.5 text-sm font-bold text-[#F4EFE6] placeholder-[#666B7A] focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl btn-game-coral text-sm sm:text-base font-black flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Create Private Game</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form: Join Room */
            <form onSubmit={handleJoinSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#A8A296] mb-1.5">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BG8X4K"
                  maxLength={8}
                  disabled={isLoading}
                  autoFocus={Boolean(joinCode)}
                  className="w-full bg-[#12141A] border border-[#313644] rounded-2xl px-4 py-3.5 text-sm font-mono font-black text-[#F59E0B] placeholder-[#666B7A] focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#A8A296] mb-1.5">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="e.g. Rahul"
                  maxLength={18}
                  disabled={isLoading}
                  className="w-full bg-[#12141A] border border-[#313644] rounded-2xl px-4 py-3.5 text-sm font-bold text-[#F4EFE6] placeholder-[#666B7A] focus:outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl btn-game-amber text-sm sm:text-base font-black flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Join Game Room</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* 3-Step Guide */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="bg-[#1A1D24] border border-[#2B303C] rounded-2xl p-3 text-left">
            <div className="w-6 h-6 rounded-lg bg-[#E11D48]/15 text-[#FB7185] flex items-center justify-center font-black text-xs mb-1.5">
              1
            </div>
            <h4 className="text-xs font-black text-[#F4EFE6]">Create Room</h4>
            <p className="text-[11px] text-[#A8A296] leading-tight mt-0.5">Get your 6-letter room code</p>
          </div>

          <div className="bg-[#1A1D24] border border-[#2B303C] rounded-2xl p-3 text-left">
            <div className="w-6 h-6 rounded-lg bg-[#D97706]/15 text-[#F59E0B] flex items-center justify-center font-black text-xs mb-1.5">
              2
            </div>
            <h4 className="text-xs font-black text-[#F4EFE6]">Invite Friend</h4>
            <p className="text-[11px] text-[#A8A296] leading-tight mt-0.5">1-click copy & share invite</p>
          </div>

          <div className="bg-[#1A1D24] border border-[#2B303C] rounded-2xl p-3 text-left">
            <div className="w-6 h-6 rounded-lg bg-[#059669]/15 text-[#34D399] flex items-center justify-center font-black text-xs mb-1.5">
              3
            </div>
            <h4 className="text-xs font-black text-[#F4EFE6]">Race to Win</h4>
            <p className="text-[11px] text-[#A8A296] leading-tight mt-0.5">Stamp 5 lines to call BINGO</p>
          </div>
        </div>
      </div>
    </div>
  );
};

