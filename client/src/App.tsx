import React from 'react';
import { useSocket } from './hooks/useSocket';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { CountdownOverlay } from './components/CountdownOverlay';
import { WinnerModal } from './components/WinnerModal';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
  const {
    gameState,
    connectionStatus,
    toasts,
    isLoading,
    addToast,
    removeToast,
    createRoom,
    joinRoom,
    setReady,
    startCountdown,
    markCell,
    requestRematch,
    leaveRoom,
  } = useSocket();

  const phase = gameState?.room.phase;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Universal Header */}
      <Header
        roomCode={gameState?.room.code}
        round={gameState?.room.round}
        connectionStatus={connectionStatus}
        onLeaveRoom={gameState ? leaveRoom : undefined}
        onShowToast={addToast}
      />

      {/* Main Content Area based on authoritative server state */}
      <main className="flex-1 flex flex-col">
        {!gameState ? (
          <Home
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            isLoading={isLoading}
            onShowToast={addToast}
          />
        ) : phase === 'WAITING_FOR_PLAYER' || phase === 'LOBBY' ? (
          <Lobby
            gameState={gameState}
            onSetReady={setReady}
            onStartCountdown={startCountdown}
            onShowToast={addToast}
          />
        ) : (
          <GameRoom
            gameState={gameState}
            onCellClick={markCell}
          />
        )}
      </main>

      {/* Countdown overlay */}
      {phase === 'COUNTDOWN' && gameState && (
        <CountdownOverlay countdown={gameState.room.countdown} />
      )}

      {/* Winner Modal overlay */}
      {phase === 'GAME_OVER' && gameState && (
        <WinnerModal
          winner={gameState.room.winner}
          me={gameState.me}
          opponent={gameState.opponent}
          onRequestRematch={requestRematch}
          onLeaveRoom={leaveRoom}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default App;
