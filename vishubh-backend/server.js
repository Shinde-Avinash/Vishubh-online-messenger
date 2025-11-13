const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const fileRoutes = require('./routes/files');
const friendRoutes = require('./routes/friends');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/friends', friendRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Vishubh Backend is running!' });
});

// Socket.IO
const userSockets = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log(`✅ User connected: ${socket.userId}`);
  
  userSockets.set(socket.userId, socket.id);
  
  // Update user status to online
  try {
    await db.query('UPDATE users SET status = ? WHERE id = ?', ['online', socket.userId]);
    
    // Get user's friends and notify them
    const [friends] = await db.query(
      `SELECT u.id FROM friendships f
       JOIN users u ON (f.user1_id = u.id OR f.user2_id = u.id) AND u.id != ?
       WHERE f.user1_id = ? OR f.user2_id = ?`,
      [socket.userId, socket.userId, socket.userId]
    );

    friends.forEach(friend => {
      const friendSocketId = userSockets.get(friend.id);
      if (friendSocketId) {
        io.to(friendSocketId).emit('friend-status', { userId: socket.userId, status: 'online' });
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }

  // Handle incoming messages
  socket.on('send-message', async (data) => {
    try {
      const receiverSocketId = userSockets.get(data.receiverId);
      
      // Emit to receiver if online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive-message', data);
      }
      
      // Also emit back to sender for confirmation
      socket.emit('message-sent', data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Typing indicators
  socket.on('typing', (data) => {
    const receiverSocketId = userSockets.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', { userId: socket.userId });
    }
  });

  socket.on('stop-typing', (data) => {
    const receiverSocketId = userSockets.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-stop-typing', { userId: socket.userId });
    }
  });

  // Friend request notifications
  socket.on('friend-request-sent', (data) => {
    const receiverSocketId = userSockets.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('friend-request-received', data);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`❌ User disconnected: ${socket.userId}`);
    userSockets.delete(socket.userId);
    
    try {
      await db.query('UPDATE users SET status = ? WHERE id = ?', ['offline', socket.userId]);
      
      // Get user's friends and notify them
      const [friends] = await db.query(
        `SELECT u.id FROM friendships f
         JOIN users u ON (f.user1_id = u.id OR f.user2_id = u.id) AND u.id != ?
         WHERE f.user1_id = ? OR f.user2_id = ?`,
        [socket.userId, socket.userId, socket.userId]
      );

      friends.forEach(friend => {
        const friendSocketId = userSockets.get(friend.id);
        if (friendSocketId) {
          io.to(friendSocketId).emit('friend-status', { userId: socket.userId, status: 'offline' });
        }
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });
});

// Create uploads directory
const fs = require('fs');
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Vishubh Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.IO listening for connections`);
});

module.exports = { io, userSockets };