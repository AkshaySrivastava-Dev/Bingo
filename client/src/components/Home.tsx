import React, { useState, useEffect } from 'react';
import { Play, UserPlus, Sparkles, Shield, Zap, RefreshCw } from 'lucide-react';

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

  // Check URL params for ?room=CODE
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
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-8 text-center">
        {/* Hero Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>REAL-TIME 1v1 MULTIPLAYER</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Play{' '}
            <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              Bingo
            </span>{' '}
            with Friends
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-medium">
            Create a private room, send the invite link to a friend, and race to complete your winning Bingo line in real-time!
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-[#0E1526]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'create'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Game
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'join'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Join Game
            </button>
          </div>

          {/* Form: Create Room */}
          {mode === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Akshay"
                  maxLength={18}
                  disabled={isLoading}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-400 hover:via-purple-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BG8X4K"
                  maxLength={8}
                  disabled={isLoading}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-indigo-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="e.g. Rahul"
                  maxLength={18}
                  disabled={isLoading}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <Zap className="w-4 h-4 text-amber-400 mb-1.5" />
            <div className="text-xs font-bold text-slate-200">Auto Call</div>
            <div className="text-[11px] text-slate-400">4s server timer</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <Shield className="w-4 h-4 text-emerald-400 mb-1.5" />
            <div className="text-xs font-bold text-slate-200">Anti-Cheat</div>
            <div className="text-[11px] text-slate-400">Server verified</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60">
            <RefreshCw className="w-4 h-4 text-sky-400 mb-1.5" />
            <div className="text-xs font-bold text-slate-200">Reconnection</div>
            <div className="text-[11px] text-slate-400">Never lose game</div>
          </div>
        </div>
      </div>
    </div>
  );
};
