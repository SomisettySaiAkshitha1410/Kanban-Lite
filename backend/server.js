require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');
const userRoutes=require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    methods: ['GET','POST','PUT','DELETE']
  }
});
global.io = io; // allow routes to emit

app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/users',userRoutes);

// root
app.get('/', (req,res) => res.json({ ok: true }));

const activeUsers = {};
io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId; 

  //console.log('Socket connection2:', socket.id, 'userId:', userId);

  let joinedBoard = null;

  socket.on('joinBoard', (boardId) => {
    joinedBoard = boardId;
    socket.join(`board_${boardId}`);

    if (!activeUsers[boardId]) activeUsers[boardId] = new Set();

    // Use the userId captured from connection scope!
    if (userId) activeUsers[boardId].add(userId);

    //console.log('joinBoard:', userId, '->', boardId);
    //console.log('Active users for board', boardId, Array.from(activeUsers[boardId]));

    const cleanIds = Array.from(activeUsers[boardId]).filter(Boolean);
    //console.log('Emitting presenceUpdate', cleanIds);
    io.to(`board_${boardId}`).emit('presenceUpdate', cleanIds);
  });

  // Same: use userId from connection for leaveBoard and disconnect
  socket.on('leaveBoard', (boardId) => {
    socket.leave(`board_${boardId}`);
    if (activeUsers[boardId]) {
      activeUsers[boardId].delete(userId);
      const cleanIds = Array.from(activeUsers[boardId]).filter(Boolean);
      io.to(`board_${boardId}`).emit('presenceUpdate', cleanIds);
    }
  });

  socket.on('disconnect', () => {
    if (joinedBoard && activeUsers[joinedBoard]) {
      activeUsers[joinedBoard].delete(userId);
      const cleanIds = Array.from(activeUsers[joinedBoard]).filter(Boolean);
      io.to(`board_${joinedBoard}`).emit('presenceUpdate', cleanIds);
    }
  });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Server running on port', PORT));
