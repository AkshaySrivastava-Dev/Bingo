# 🚀 Deploying Bingo Live on Render (Single Web Service)

This project is configured for deployment as a **single Node.js Web Service** on Render. Express serves the compiled React/Vite frontend static files and handles the real-time Socket.IO WebSocket connections on the same port.

---

## 📋 Render Configuration Settings

When creating a new **Web Service** on [Render Dashboard](https://dashboard.render.com/):

| Setting | Value |
|---|---|
| **Environment** | `Node` |
| **Branch** | `main` (or your active branch) |
| **Root Directory** | `.` (Leave blank or set to repository root) |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Node Version** | `18` or higher (e.g. `20` or `22`) |

---

## ⚙️ Environment Variables (Optional)

| Key | Default Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Set automatically by Render |
| `PORT` | Set by Render (e.g. `10000`) | Server binds to `0.0.0.0:$PORT` |

---

## 🔍 How It Works in Production

1. **Build Step (`npm run build`)**:
   - Runs `npm --prefix client install && npm --prefix client run build` to compile the React TypeScript frontend into `client/dist/`.
   - Runs `tsc` to compile the server TypeScript files into `dist/server/`.
2. **Start Step (`npm start`)**:
   - Runs `node dist/server/index.js`.
   - Express binds to `0.0.0.0:$PORT` (provided dynamically by Render).
   - Serves the compiled SPA frontend from `client/dist/` with full SPA route fallback.
   - Attaches the Socket.IO WebSocket server directly to the same HTTP server instance.
3. **No Localhost URLs**:
   - Client Socket.IO connects via `io()` with no hardcoded hosts, automatically using `window.location.origin` (`https://your-app.onrender.com`).
   - Invite links automatically format as `https://your-app.onrender.com/?room=XXXXXX`.
