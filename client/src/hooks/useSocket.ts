import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientGameState, ConnectionStatus, ToastMessage } from '../types/game';
import { sound } from '../utils/audio';

const SESSION_KEY = 'bingo_online_session';

export function useSocket() {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize socket connection
  useEffect(() => {
    // Connect to server (proxied by Vite or relative in production)
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');

      // Attempt automatic session restoration if saved in localStorage
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const { roomId, sessionToken } = JSON.parse(savedSession);
          if (roomId && sessionToken) {
            setIsLoading(true);
            socket.emit(
              'reconnect_player',
              { roomId, sessionToken },
              (res: { success: boolean; state?: ClientGameState; code?: string; message?: string }) => {
                setIsLoading(false);
                if (res.success && res.state) {
                  setGameState(res.state);
                  addToast('Reconnected to your game session!', 'success');
                } else {
                  // Session invalid or room closed
                  localStorage.removeItem(SESSION_KEY);
                  setGameState(null);
                  if (res.message) {
                    addToast(res.message, 'warning');
                  }
                }
              }
            );
          }
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('reconnecting');
    });

    // Authoritative room state updates
    socket.on('room_state_update', (newState: ClientGameState) => {
      setGameState((prevState) => {
        // Sound triggers
        if (!prevState?.opponent && newState.opponent) {
          sound.playPlayerJoined();
          addToast(`${newState.opponent.name} joined the lobby!`, 'info');
        }

        if (prevState?.room.phase !== 'GAME_OVER' && newState.room.phase === 'GAME_OVER' && newState.room.winner) {
          sound.playBingoWin();
        }

        return newState;
      });
    });

    // Countdown tick
    socket.on('countdown_tick', (data: { countdown: number }) => {
      if (data.countdown > 0) {
        sound.playCountdownTick();
      } else {
        sound.playCountdownGo();
      }
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          room: {
            ...prev.room,
            countdown: data.countdown,
          },
        };
      });
    });

    // Player status update (e.g. opponent disconnect)
    socket.on(
      'player_status_change',
      (data: { playerId: string; name: string; isConnected: boolean }) => {
        setGameState((prev) => {
          if (!prev || !prev.opponent || prev.opponent.id !== data.playerId) return prev;
          if (!data.isConnected) {
            addToast(`${data.name} temporarily disconnected.`, 'warning');
          } else {
            addToast(`${data.name} reconnected!`, 'success');
          }
          return {
            ...prev,
            opponent: {
              ...prev.opponent,
              isConnected: data.isConnected,
            },
          };
        });
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [addToast]);

  // Actions
  const createRoom = useCallback(
    (playerName: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!socketRef.current) {
          addToast('Network connection not ready.', 'error');
          resolve(false);
          return;
        }

        setIsLoading(true);
        socketRef.current.emit(
          'create_room',
          { playerName },
          (res: { success: boolean; state?: ClientGameState; code?: string; message?: string }) => {
            setIsLoading(false);
            if (res.success && res.state) {
              setGameState(res.state);
              // Save session
              localStorage.setItem(
                SESSION_KEY,
                JSON.stringify({
                  roomId: res.state.room.id,
                  sessionToken: res.state.me.sessionToken,
                })
              );
              addToast('Room created! Share the invite link with your friend.', 'success');
              resolve(true);
            } else {
              sound.playError();
              addToast(res.message || 'Failed to create room.', 'error');
              resolve(false);
            }
          }
        );
      });
    },
    [addToast]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!socketRef.current) {
          addToast('Network connection not ready.', 'error');
          resolve(false);
          return;
        }

        setIsLoading(true);
        socketRef.current.emit(
          'join_room',
          { roomCode, playerName },
          (res: { success: boolean; state?: ClientGameState; code?: string; message?: string }) => {
            setIsLoading(false);
            if (res.success && res.state) {
              setGameState(res.state);
              // Save session
              localStorage.setItem(
                SESSION_KEY,
                JSON.stringify({
                  roomId: res.state.room.id,
                  sessionToken: res.state.me.sessionToken,
                })
              );
              addToast('Joined game room!', 'success');
              resolve(true);
            } else {
              sound.playError();
              addToast(res.message || 'Failed to join room.', 'error');
              resolve(false);
            }
          }
        );
      });
    },
    [addToast]
  );

  // Host Action: Set Game Mode in Lobby
  const setGameMode = useCallback(
    (mode: ClientGameState['room']['mode']) => {
      if (!socketRef.current || !gameState) return;
      socketRef.current.emit(
        'set_game_mode',
        {
          roomId: gameState.room.id,
          sessionToken: gameState.me.sessionToken,
          mode,
        },
        (res: { success: boolean; code?: string; message?: string }) => {
          if (!res.success) {
            sound.playError();
            addToast(res.message || 'Failed to set game mode.', 'error');
          }
        }
      );
    },
    [gameState, addToast]
  );

  const setReady = useCallback(
    (isReady: boolean) => {
      if (!socketRef.current || !gameState) return;
      socketRef.current.emit(
        'set_ready',
        {
          roomId: gameState.room.id,
          sessionToken: gameState.me.sessionToken,
          isReady,
        },
        (res: { success: boolean; code?: string; message?: string }) => {
          if (!res.success) {
            sound.playError();
            addToast(res.message || 'Failed to update ready state.', 'error');
          }
        }
      );
    },
    [gameState, addToast]
  );

  const startCountdown = useCallback(() => {
    if (!socketRef.current || !gameState) return;
    socketRef.current.emit(
      'start_countdown',
      {
        roomId: gameState.room.id,
        sessionToken: gameState.me.sessionToken,
      },
      (res: { success: boolean; code?: string; message?: string }) => {
        if (!res.success) {
          sound.playError();
          addToast(res.message || 'Cannot start game.', 'error');
        }
      }
    );
  }, [gameState, addToast]);

  // Fast Turn Action: Select an item on your turn (immediately marks & auto-marks opponent)
  const selectItem = useCallback(
    (row: number, col: number, item: ClientGameState['me']['board'][0][0]) => {
      if (!socketRef.current || !gameState) return;
      if (gameState.room.phase !== 'PLAYING') return;
      if (!gameState.room.isMyTurn) return;

      socketRef.current.emit(
        'select_item',
        {
          roomId: gameState.room.id,
          sessionToken: gameState.me.sessionToken,
          row,
          col,
          item,
        },
        (res: {
          success: boolean;
          isBingo?: boolean;
          winner?: any;
          nextPlayerId?: string;
          moveRecord?: any;
          code?: string;
          message?: string;
        }) => {
          if (res.success) {
            sound.playCellMarked();
            if (res.moveRecord?.markedOnOpponent) {
              addToast('Marked on both boards!', 'success');
            }
          } else {
            sound.playError();
            if (res.message) {
              addToast(res.message, 'warning');
            }
          }
        }
      );
    },
    [gameState, addToast]
  );

  const requestRematch = useCallback(() => {
    if (!socketRef.current || !gameState) return;
    socketRef.current.emit(
      'request_rematch',
      {
        roomId: gameState.room.id,
        sessionToken: gameState.me.sessionToken,
      },
      (res: { success: boolean; bothAgreed?: boolean; code?: string; message?: string }) => {
        if (res.success) {
          setGameState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              me: {
                ...prev.me,
                rematchRequested: true,
              },
            };
          });
          if (!res.bothAgreed) {
            addToast('Rematch requested! Waiting for opponent...', 'info');
          }
        } else {
          sound.playError();
          addToast(res.message || 'Failed to request rematch.', 'error');
        }
      }
    );
  }, [gameState, addToast]);

  const leaveRoom = useCallback(() => {
    if (socketRef.current && gameState) {
      socketRef.current.emit('leave_room', {
        roomId: gameState.room.id,
        sessionToken: gameState.me.sessionToken,
      });
    }
    localStorage.removeItem(SESSION_KEY);
    setGameState(null);
    addToast('Left the game room.', 'info');
  }, [gameState, addToast]);

  return {
    gameState,
    connectionStatus,
    toasts,
    isLoading,
    addToast,
    removeToast,
    createRoom,
    joinRoom,
    setGameMode,
    setReady,
    startCountdown,
    selectItem,
    requestRematch,
    leaveRoom,
  };
}

