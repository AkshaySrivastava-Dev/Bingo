import React from 'react';
import type { ClientGameState } from '../types/game';
import { BingoBoard } from './BingoBoard';
import { CurrentNumber } from './CurrentNumber';
import { CalledNumbers } from './CalledNumbers';
import { PlayerCard } from './PlayerCard';
import { Users } from 'lucide-react';

interface GameRoomProps {
  gameState: ClientGameState;
  onCellClick: (row: number, col: number, value: number) => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({ gameState, onCellClick }) => {
  const { room, me, opponent } = gameState;
  const isGameActive = room.phase === 'PLAYING';

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Banner on Mobile / Game status */}
      <div className="lg:hidden space-y-4">
        <CurrentNumber
          currentNumber={room.currentNumber}
          totalCalled={room.totalCalled}
        />
        <CalledNumbers calledNumbers={room.calledNumbers} />
      </div>

      {/* Main Gameplay Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Interactive 5x5 Bingo Board (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <BingoBoard
            board={me.board}
            markedCells={me.markedCells}
            calledNumbers={room.calledNumbers}
            winningPattern={room.winner?.winningPattern}
            isGameActive={isGameActive}
            onCellClick={onCellClick}
          />
        </div>

        {/* Right Side: Game Info, Current Number, Player Progress & History (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Current Number display (desktop view) */}
          <div className="hidden lg:block">
            <CurrentNumber
              currentNumber={room.currentNumber}
              totalCalled={room.totalCalled}
            />
          </div>

          {/* Called Numbers history (desktop view) */}
          <div className="hidden lg:block">
            <CalledNumbers calledNumbers={room.calledNumbers} />
          </div>

          {/* Live Player Progress Cards */}
          <div className="bg-[#0E1526]/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Live Standings
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                1st to complete 5 numbers wins!
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
                />
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 text-center">
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
