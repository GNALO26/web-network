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

// Authentification Socket.io
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
          referenceId: conversationId  // ← important pour redirection
        });
        io.to(otherId.toString()).emit('newMessage', populatedMessage);
        io.to(otherId.toString()).emit('notification', { type: 'message' });
      }
      io.to(conversationId).emit('newMessage', populatedMessage);
    } catch (err) {
      console.error('Erreur sendMessage socket:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket déconnecté: ${socket.userId}`);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));