// backend/server.js
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./src/app');

connectDB();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware d'authentification Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Socket connecté: ${socket.userId}`);
  socket.join(socket.userId);

  // --- MESSAGERIE TEXTE ET FICHIERS ---
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const Conversation = require('./src/models/Conversation');
      const Message = require('./src/models/Message');
      const Notification = require('./src/models/Notification');
      const { conversationId, text } = data;
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId)) return;

      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userId,
        text
      });
      conversation.lastMessage = text;
      conversation.lastMessageTime = Date.now();
      await conversation.save();

      const populatedMessage = await message.populate('sender', 'name avatar');
      const otherId = conversation.participants.find(p => p.toString() !== socket.userId.toString());

      if (otherId) {
        await Notification.create({
          recipient: otherId,
          sender: socket.userId,
          type: 'message',
          referenceId: conversationId
        });
        io.to(otherId.toString()).emit('newMessage', populatedMessage);
      }
    } catch (err) {
      console.error('Erreur sendMessage socket:', err);
    }
  });

  // --- SIGNALISATION WEBRTC (APPELS AUDIO/VIDÉO) ---
  socket.on('call:join', ({ roomId, userId, isVideo }) => {
    socket.join(roomId);
    socket.to(roomId).emit('call:user-joined', { userId, isVideo });
  });

  socket.on('call:signal', ({ roomId, signal, userId }) => {
    socket.to(roomId).emit('call:signal', { signal, userId });
  });

  socket.on('call:offer', ({ roomId, offer, userId }) => {
    socket.to(roomId).emit('call:offer', { offer, userId });
  });

  socket.on('call:answer', ({ roomId, answer, userId }) => {
    socket.to(roomId).emit('call:answer', { answer, userId });
  });

  socket.on('call:ice-candidate', ({ roomId, candidate, userId }) => {
    socket.to(roomId).emit('call:ice-candidate', { candidate, userId });
  });

  socket.on('call:leave', async ({ roomId, userId, duration, recordingUrl, recordingType }) => {
    socket.to(roomId).emit('call:user-left', { userId });
    socket.leave(roomId);
    // Sauvegarde de l'enregistrement pour l'admin
    if (recordingUrl && recordingType) {
      try {
        const CallRecord = require('./src/models/CallRecord');
        // Récupération des participants de la room (simplifié)
        const roomSockets = await io.in(roomId).fetchSockets();
        const participants = roomSockets.map(s => s.userId).filter(id => id && id !== userId);
        participants.push(userId);
        await CallRecord.create({
          participants,
          duration: duration || 0,
          recordingUrl,
          recordingType,
          initiatedBy: userId,
          endedAt: new Date()
        });
      } catch (err) {
        console.error('Erreur sauvegarde appel:', err);
      }
    }
  });

  // --- MESSAGES VOCAUX (notification temps réel) ---
  socket.on('voice-message:sent', ({ receiverId, messageId }) => {
    io.to(receiverId).emit('new-voice-message', { messageId });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket déconnecté: ${socket.userId}`);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));