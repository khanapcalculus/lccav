const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL, process.env.CLIENT_URL.replace(/\/$/, '')] // Allow with and without trailing slash
  : ["*"];

const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin matches allowed origins
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === "*") return true;
        // Allow exact match or origin that starts with the allowed URL
        return origin === allowed || origin.startsWith(allowed);
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure CORS for Express
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CLIENT_URL 
      ? [process.env.CLIENT_URL, process.env.CLIENT_URL.replace(/\/$/, '')]
      : ["*"];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === "*") return true;
      return origin === allowed || origin.startsWith(allowed);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Store rooms and their participants
const rooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('join-room', (roomId, userId, userName) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    const room = rooms.get(roomId);
    room.set(socket.id, { userId, userName, socketId: socket.id });
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId,
      userName,
      socketId: socket.id
    });
    
    // Send list of existing users to the new user
    const existingUsers = Array.from(room.values())
      .filter(user => user.socketId !== socket.id)
      .map(user => ({
        userId: user.userId,
        userName: user.userName,
        socketId: user.socketId
      }));
    
    socket.emit('existing-users', existingUsers);
    
    console.log(`User ${userName} (${userId}) joined room ${roomId}`);
  });

  // WebRTC signaling: offer
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  // WebRTC signaling: answer
  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  // WebRTC signaling: ICE candidate
  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Chat message
  socket.on('chat-message', (data) => {
    const roomId = Array.from(socket.rooms).find(room => room !== socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      const user = room?.get(socket.id);
      io.to(roomId).emit('chat-message', {
        userId: user?.userId || socket.id,
        userName: user?.userName || 'Unknown',
        message: data.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // User toggled video/audio
  socket.on('user-toggle', (data) => {
    const roomId = Array.from(socket.rooms).find(room => room !== socket.id);
    if (roomId) {
      socket.to(roomId).emit('user-toggle', {
        socketId: socket.id,
        video: data.video,
        audio: data.audio
      });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and remove user from room
    for (const [roomId, room] of rooms.entries()) {
      if (room.has(socket.id)) {
        const user = room.get(socket.id);
        room.delete(socket.id);
        
        // Notify others
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userId: user.userId,
          userName: user.userName
        });
        
        // Clean up empty rooms
        if (room.size === 0) {
          rooms.delete(roomId);
        }
        
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Signaling server running on ${HOST}:${PORT}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

