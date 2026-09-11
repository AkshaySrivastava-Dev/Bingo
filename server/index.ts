import express from 'express';
import http from 'node:http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { RoomManager } from './roomManager.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve compiled client static assets in production (Express 5 compatible SPA fallback)
const clientDist = path.join(process.cwd(), 'client/dist');
if (fs.existsSync(clientDist)) {
  console.log(`Serving static client files from ${clientDist}`);
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/socket.io') && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// Socket.IO event handlers
io.on('connection', (socket: Socket) => {
  // 1. Create Room
  socket.on('create_room', (data: { playerName: string }, callback) => {
    try {
      const { playerName } = data || {};
      const { room, player } = roomManager.createRoom(playerName, socket.id);
      socket.join(room.id);

      const clientState = roomManager.getClientState(room, player.sessionToken);
      if (typeof callback === 'function') {
        callback({ success: true, state: clientState });
      }
    } catch (err: any) {
      console.error('Error creating room:', err);
      if (typeof callback === 'function') {
        callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to create room.' });
      }
    }
  });

  // 2. Join Room
  socket.on('join_room', (data: { roomCode: string; playerName: string }, callback) => {
    try {
      const { roomCode, playerName } = data || {};
      const result = roomManager.joinRoom(roomCode, playerName, socket.id);

      if (!result.success || !result.room || !result.player) {
        if (typeof callback === 'function') {
          callback({ success: false, code: result.errorCode, message: result.errorMessage });
        }
        return;
      }

      socket.join(result.room.id);
      const clientState = roomManager.getClientState(result.room, result.player.sessionToken);

      if (typeof callback === 'function') {
        callback({ success: true, state: clientState });
      }

      // Broadcast state update to both players in the room
      roomManager.broadcastRoomUpdate(result.room);
    } catch (err: any) {
      console.error('Error joining room:', err);
      if (typeof callback === 'function') {
        callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to join room.' });
      }
    }
  });

  // 3. Reconnect Player
  socket.on('reconnect_player', (data: { roomId: string; sessionToken: string }, callback) => {
    try {
      const { roomId, sessionToken } = data || {};
      const result = roomManager.reconnectPlayer(roomId, sessionToken, socket.id);

      if (!result.success || !result.room || !result.player) {
        if (typeof callback === 'function') {
          callback({ success: false, code: result.errorCode, message: result.errorMessage });
        }
        return;
      }

      socket.join(result.room.id);
      const clientState = roomManager.getClientState(result.room, result.player.sessionToken);

      if (typeof callback === 'function') {
        callback({ success: true, state: clientState });
      }

      // Notify opponent
      roomManager.broadcastRoomUpdate(result.room);
    } catch (err: any) {
      console.error('Error reconnecting player:', err);
      if (typeof callback === 'function') {
        callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to reconnect.' });
      }
    }
  });

  // 4. Set Ready State
  socket.on('set_ready', (data: { roomId: string; sessionToken: string; isReady: boolean }, callback) => {
    try {
      const { roomId, sessionToken, isReady } = data || {};
      const result = roomManager.setPlayerReady(roomId, sessionToken, isReady);

      if (!result.success || !result.room) {
        if (typeof callback === 'function') {
          callback({ success: false, code: result.errorCode, message: result.errorMessage });
        }
        return;
      }

      if (typeof callback === 'function') {
        callback({ success: true });
      }

      roomManager.broadcastRoomUpdate(result.room);
    } catch (err: any) {
      console.error('Error setting ready:', err);
      if (typeof callback === 'function') {
        callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to set ready state.' });
      }
    }
  });

  // 5. Set Game Mode (Host only in lobby)
  socket.on(
    'set_game_mode',
    (data: { roomId: string; sessionToken: string; mode: any }, callback) => {
      try {
        const { roomId, sessionToken, mode } = data || {};
        const result = roomManager.setGameMode(roomId, sessionToken, mode);

        if (!result.success) {
          if (typeof callback === 'function') {
            callback({ success: false, code: result.errorCode, message: result.errorMessage });
          }
          return;
        }

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (err: any) {
        console.error('Error setting game mode:', err);
        if (typeof callback === 'function') {
          callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to set game mode.' });
        }
      }
    }
  );

  // 6. Start Countdown / Start Game
  socket.on('start_countdown', (data: { roomId: string; sessionToken: string }, callback) => {
    try {
      const { roomId, sessionToken } = data || {};
      const result = roomManager.startCountdown(roomId, sessionToken);

      if (!result.success) {
        if (typeof callback === 'function') {
          callback({ success: false, code: result.errorCode, message: result.errorMessage });
        }
        return;
      }

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (err: any) {
      console.error('Error starting countdown:', err);
      if (typeof callback === 'function') {
        callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to start game.' });
      }
    }
  });

  // 7. Select Item (Fast turn-based atomic move)
  socket.on(
    'select_item',
    (
      data: { roomId: string; sessionToken: string; row: number; col: number; item: any },
      callback
    ) => {
      try {
        const { roomId, sessionToken, row, col, item } = data || {};
        const result = roomManager.selectItem(roomId, sessionToken, row, col, item);

        if (!result.success) {
          if (typeof callback === 'function') {
            callback({ success: false, code: result.errorCode, message: result.errorMessage });
          }
          return;
        }

        if (typeof callback === 'function') {
          callback({
            success: true,
            isBingo: result.isBingo,
            winner: result.winner,
            nextPlayerId: result.nextPlayerId,
            moveRecord: result.moveRecord,
          });
        }
      } catch (err: any) {
        console.error('Error selecting item:', err);
        if (typeof callback === 'function') {
          callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to select item.' });
        }
      }
    }
  );

  // 7. Request Rematch
  socket.on('request_rematch', (data: { roomId: string; sessionToken: string }, callback) => {
    try {
      const { roomId, sessionToken } = data || {};
      const result = roomManager.requestRematch(roomId, sessionToken);

      if (!result.success) {
        if (typeof callback === 'function') {
          callback({ success: false, code: result.errorCode, message: result.errorMessage });
        }
        return;
      }

      if (typeof callback === 'function') {
        callback({ success: true, bothAgreed: result.bothAgreed });
      }
    } catch (err: any) {
      console.error('Error requesting rematch:', err);
      if (typeof callback === 'function') {
        callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to request rematch.' });
      }
    }
  });

  // 8. Leave Room
  socket.on('leave_room', (data: { roomId: string; sessionToken: string }, callback) => {
    try {
      const { roomId, sessionToken } = data || {};
      roomManager.leaveRoom(roomId, sessionToken);
      socket.leave(roomId);

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (err: any) {
      console.error('Error leaving room:', err);
      if (typeof callback === 'function') {
        callback({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to leave room.' });
      }
    }
  });

  // 9. Socket Disconnect
  socket.on('disconnect', () => {
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bingo server listening on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`);
});
