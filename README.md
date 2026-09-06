# 🎯 Bingo Live — Real-Time Multiplayer Online Bingo

A polished, fully functional real-time 2-player Bingo web game built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, and **Socket.IO**.

---

## ✨ Features

- 🎮 **Real-Time 1v1 Multiplayer**: Private room creation with 6-character room codes and 1-click shareable invite links.
- 🔒 **Server-Authoritative Game Engine**: Board generation, number calling, cell marking, and win validation are strictly enforced on the server to prevent desyncs and cheating.
- ⚡ **Auto Number Calling**: Shuffled 1–75 pool with a 4-second automated calling timer and animated 3D-styled Bingo ball.
- 🛡️ **Session Reconnection**: Reconnects players seamlessly after page refreshes or temporary network drops using persistent session tokens without losing progress or board marks.
- 📊 **Live Progress & Standings**: Real-time line progress indicator (`4/5`) and completed line counters for both players.
- 🏆 **Instant Bingo Detection & Victory Celebration**: Immediate server-locked game over, confetti bursts (`canvas-confetti`), winning line highlight, and rematch system.
- 🎵 **Web Audio API Sound Engine**: Zero-asset procedural synthesizer for ball drops, cell clicks, error buzzers, and winner fanfares with a mute switch.
- 📱 **Fully Responsive Modern UI**: Dark glassmorphic aesthetic optimized for desktop, tablets, and mobile screens without horizontal scrolling.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# In the root directory
npm install
npm --prefix client install
```

### 2. Run in Development Mode

```bash
npm run dev
```

This starts:
- **Backend Socket.IO Server**: `http://localhost:3001`
- **Frontend Vite Dev Server**: `http://localhost:5174` (Proxies Socket.IO traffic to port 3001)

### 3. Production Build & Start

```bash
npm run build
NODE_ENV=production npm start
```

---

## 🕹️ How to Play

1. Open `http://localhost:5174` (or your deployed URL).
2. Enter your name and click **Create Game**.
3. Copy the **Invite Link** or **Room Code** and send it to your friend.
4. Friend opens the invite link or enters the room code to join.
5. Both players click **Ready**.
6. Host clicks **Start Game**.
7. Numbers are called every 4 seconds. Tap flashing numbers on your board to mark them.
8. The first player to complete a horizontal row, vertical column, or diagonal line wins!
9. Click **Play Again** to start a fresh round with new randomized boards in the same room.

---

## 🧪 Testing

Run the automated multi-client Socket.IO end-to-end test suite:

```bash
npx tsx server/test_multiplayer_e2e.ts
```

Tests verify room creation, 2-player join, 3rd player capacity rejection, ready states, countdowns, synchronized 1-75 calling, anti-cheat validation, simultaneous win locks, state restoration on refresh, and rematch transitions.
