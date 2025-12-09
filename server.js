const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const DEBUG = {
  NETWORK: true,
  POSITION: false
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const players = new Map();

io.on('connection', (socket) => {
  if (DEBUG.NETWORK) console.log(`[SERVER] Player connected: ${socket.id}`);
  
  players.set(socket.id, {
    id: socket.id,
    position: { x: 0, y: 1.6, z: 2 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    controller: {
      position: { x: 0.15, y: 1.4, z: -0.4 },
      rotation: { x: 0, y: 0, z: 0, w: 1 }
    }
  });

  socket.emit('players-list', Array.from(players.values()));
  socket.broadcast.emit('player-joined', players.get(socket.id));
  
  if (DEBUG.NETWORK) console.log(`[SERVER] Total players: ${players.size}`);

  socket.on('player-update', (data) => {
    if (players.has(socket.id)) {
      if (DEBUG.POSITION) console.log(`[SERVER] Player ${socket.id.slice(-4)} moved`);
      players.set(socket.id, { ...players.get(socket.id), ...data });
      socket.broadcast.emit('player-moved', { id: socket.id, ...data });
    }
  });

  socket.on('disconnect', () => {
    if (DEBUG.NETWORK) console.log(`[SERVER] Player disconnected: ${socket.id}`);
    players.delete(socket.id);
    socket.broadcast.emit('player-left', socket.id);
    if (DEBUG.NETWORK) console.log(`[SERVER] Total players: ${players.size}`);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[SERVER] Multiplayer server running on 127.0.0.1:${PORT}`);
});
