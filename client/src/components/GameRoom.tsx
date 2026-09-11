import React from 'react';
import type { ClientGameState, BingoItem } from '../types/game';
import { BingoBoard } from './BingoBoard';
import { CurrentNumber } from './CurrentNumber';
import { CalledNumbers } from './CalledNumbers';
import { PlayerCard } from './PlayerCard';
import { Users, Sparkles, Clock } from 'lucide-react';

interface GameRoomProps {
  gameState: ClientGameState;
  onCellClick: (row: number, col: number, item: BingoItem) => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({ gameState, onCellClick }) => {
  const { room, me, opponent } = gameState;
  const isGameActive = room.phase === 'PLAYING';
  const gameMode = room.mode || 'NUMBERS_ONLY';

  // Active player name helper
  const activePlayerName =
    room.activePlayerId === me.id
      ? me.name
      : opponent?.id === room.activePlayerId
      ? opponent.name
      : 'Player';

  const lastMove =
    room.playHistory && room.playHistory.length > 0
      ? room.playHistory[room.playHistory.length - 1]
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* Prominent Fast Turn Banner */}
      {isGameActive && (
        <div
          className={`w-full py-3.5 px-4 sm:px-6 rounded-2xl border flex items-center justify-between gap-3 shadow-lg transition-all ${
            room.isMyTurn
              ? 'bg-gradient-to-r from-[#D97706]/20 via-[#B45309]/15 to-[#D97706]/20 border-[#F59E0B] text-[#F59E0B]'
              : 'bg-[#1A1D24] border-[#313644] text-[#A8A296]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {room.isMyTurn ? (
              <>
                <Sparkles className="w-5 h-5 shrink-0 text-[#F59E0B] animate-spin-slow" />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-[#F4EFE6]">
                    YOUR TURN TO PICK
                  </h2>
                  <p className="text-xs font-semibold text-[#F59E0B] truncate">
                    Tap any unmarked tile on your board to choose it!
                  </p>
                </div>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 shrink-0 text-[#A8A296]" />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-[#F4EFE6]">
                    {opponent?.name || 'OPPONENT'}&apos;S TURN
                  </h2>
                  <p className="text-xs font-semibold text-[#A8A296] truncate">
                    Opponent is picking a tile from their board...
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#12141A] border border-[#313644] text-xs font-mono font-bold text-[#A8A296]">
            <span>Round {room.round}</span>
          </div>
        </div>
      )}

      {/* Top Banner on Mobile */}
      <div className="lg:hidden space-y-4">
        <CurrentNumber
          lastMove={lastMove}
          mode={gameMode}
          activePlayerName={activePlayerName}
          isMyTurn={room.isMyTurn}
          totalCalls={room.playHistory?.length ?? 0}
        />
        <CalledNumbers
          playHistory={room.playHistory || []}
          mode={gameMode}
        />
      </div>

      {/* Main Gameplay Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Interactive 5x5 Bingo Board (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <BingoBoard
            board={me.board}
            mode={gameMode}
            markedCells={me.markedCells}
            winningPattern={room.winner?.winningPattern}
            isGameActive={isGameActive}
            isMyTurn={room.isMyTurn}
            onCellClick={onCellClick}
          />
        </div>

        {/* Right Side: Game Info, Current Number, Player Progress & History (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Current Move display (desktop view) */}
          <div className="hidden lg:block">
            <CurrentNumber
              lastMove={lastMove}
              mode={gameMode}
              activePlayerName={activePlayerName}
              isMyTurn={room.isMyTurn}
              totalCalls={room.playHistory?.length ?? 0}
            />
          </div>

          {/* Called Numbers history (desktop view) */}
          <div className="hidden lg:block">
            <CalledNumbers
              playHistory={room.playHistory || []}
              mode={gameMode}
            />
          </div>

          {/* Live Player Progress Cards */}
          <div className="bg-[#1A1D24] border border-[#313644] rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#2B303C] pb-2.5">
              <h3 className="text-xs uppercase font-black tracking-wider text-[#A8A296] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
                Live Standings
              </h3>
              <span className="text-[11px] font-semibold text-[#A8A296]">
                1 completed line wins!
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Me */}
              <PlayerCard
                name={me.name}
                avatarColor={me.avatarColor}
                isHost={me.isHost}
                isConnected={me.isConnected}
                bestLineCount={me.bestLineCount}
                completedLines={me.completedLines}
                isMe={true}
                phase={room.phase}
                isPlayerTurn={room.isMyTurn}
              />

              {/* Opponent */}
              {opponent ? (
                <PlayerCard
                  name={opponent.name}
                  avatarColor={opponent.avatarColor}
                  isHost={opponent.isHost}
                  isConnected={opponent.isConnected}
                  bestLineCount={opponent.bestLineCount}
                  completedLines={opponent.completedLines}
                  isMe={false}
                  phase={room.phase}
                  isPlayerTurn={!room.isMyTurn}
                />
              ) : (
                <div className="p-3 rounded-xl bg-[#12141A] border border-[#313644] text-xs text-[#A8A296] text-center">
                  Opponent disconnected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


