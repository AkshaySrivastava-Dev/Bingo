import React from 'react';
import type { ClientGameState } from '../types/game';
import { BingoBoard } from './BingoBoard';
import { CurrentNumber } from './CurrentNumber';
import { CalledNumbers } from './CalledNumbers';
import { PlayerCard } from './PlayerCard';
import { Users, Sparkles, Clock, AlertCircle } from 'lucide-react';

interface GameRoomProps {
  gameState: ClientGameState;
  onCellClick: (row: number, col: number, value: number) => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({ gameState, onCellClick }) => {
  const { room, me, opponent } = gameState;
  const isGameActive = room.phase === 'PLAYING';

  // Active player name helper
  const activePlayerName =
    room.activePlayerId === me.id
      ? me.name
      : opponent?.id === room.activePlayerId
      ? opponent.name
      : 'Player';

  const lastMove = room.playHistory && room.playHistory.length > 0
    ? room.playHistory[room.playHistory.length - 1]
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* Prominent Turn Banner */}
      {isGameActive && (
        <div
          className={`w-full py-3 px-4 sm:px-6 rounded-2xl border flex items-center justify-between gap-3 shadow-lg transition-all ${
            room.isMyTurn && room.turnState === 'SELECTING'
              ? 'bg-gradient-to-r from-[#D97706]/20 via-[#B45309]/15 to-[#D97706]/20 border-[#F59E0B] text-[#F59E0B]'
              : room.isPendingResponder && room.turnState === 'WAITING_FOR_RESPONSE'
              ? 'bg-gradient-to-r from-[#E11D48]/20 via-[#9F1239]/15 to-[#E11D48]/20 border-[#F43F5E] text-[#FB7185] animate-pulse'
              : room.isMyTurn && room.turnState === 'WAITING_FOR_RESPONSE'
              ? 'bg-[#1A1D24] border-[#313644] text-[#A8A296]'
              : 'bg-[#1A1D24] border-[#313644] text-[#A8A296]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {room.isMyTurn && room.turnState === 'SELECTING' ? (
              <>
                <Sparkles className="w-5 h-5 shrink-0 text-[#F59E0B]" />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-[#F4EFE6]">
                    YOUR TURN TO CHOOSE
                  </h2>
                  <p className="text-xs font-semibold text-[#F59E0B] truncate">
                    Tap any unmarked number from your board to call it!
                  </p>
                </div>
              </>
            ) : room.isPendingResponder && room.turnState === 'WAITING_FOR_RESPONSE' ? (
              <>
                <AlertCircle className="w-5 h-5 shrink-0 text-[#FB7185]" />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-[#F4EFE6]">
                    OPPONENT CALLED {room.pendingNumber?.number}!
                  </h2>
                  <p className="text-xs font-semibold text-[#FB7185] truncate">
                    It matches your board! Tap the highlighted cell to STAMP it.
                  </p>
                </div>
              </>
            ) : room.isMyTurn && room.turnState === 'WAITING_FOR_RESPONSE' ? (
              <>
                <Clock className="w-5 h-5 shrink-0 text-[#F59E0B]" />
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-[#F4EFE6]">
                    YOU CALLED {room.pendingNumber?.number}
                  </h2>
                  <p className="text-xs font-semibold text-[#A8A296] truncate">
                    Waiting for {opponent?.name || 'opponent'} to check their board...
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
                    Opponent is picking a number from their board...
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
          pendingNumber={room.pendingNumber}
          lastMove={lastMove}
          turnState={room.turnState}
          activePlayerName={activePlayerName}
          isMyTurn={room.isMyTurn}
          isPendingResponder={room.isPendingResponder}
          totalCalls={room.allSelectedNumbers?.length ?? 0}
        />
        <CalledNumbers
          playHistory={room.playHistory || []}
          allSelectedNumbers={room.allSelectedNumbers || []}
        />
      </div>

      {/* Main Gameplay Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Interactive 5x5 Bingo Board (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <BingoBoard
            board={me.board}
            markedCells={me.markedCells}
            winningPattern={room.winner?.winningPattern}
            isGameActive={isGameActive}
            isMyTurn={room.isMyTurn}
            turnState={room.turnState}
            isPendingResponder={room.isPendingResponder}
            pendingNumber={room.pendingNumber}
            allSelectedNumbers={room.allSelectedNumbers || []}
            onCellClick={onCellClick}
          />
        </div>

        {/* Right Side: Game Info, Current Number, Player Progress & History (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Current Move display (desktop view) */}
          <div className="hidden lg:block">
            <CurrentNumber
              pendingNumber={room.pendingNumber}
              lastMove={lastMove}
              turnState={room.turnState}
              activePlayerName={activePlayerName}
              isMyTurn={room.isMyTurn}
              isPendingResponder={room.isPendingResponder}
              totalCalls={room.allSelectedNumbers?.length ?? 0}
            />
          </div>

          {/* Called Numbers history (desktop view) */}
          <div className="hidden lg:block">
            <CalledNumbers
              playHistory={room.playHistory || []}
              allSelectedNumbers={room.allSelectedNumbers || []}
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
                turnState={room.turnState}
                isPendingResponder={room.isPendingResponder}
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
                  turnState={room.turnState}
                  isPendingResponder={!room.isPendingResponder}
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

