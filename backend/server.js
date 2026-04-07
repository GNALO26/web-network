const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./src/app');

// Connexion à MongoDB
connectDB();

// Création du serveur HTTP
const server = http.createServer(app);

// Configuration Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware d'authentification Socket.io (vérification du token JWT)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: token manquant'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error: token invalide'));
  }
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log(`✅ Socket connecté : ${socket.userId}`);
  
  // Rejoindre une room personnelle (pour notifications individuelles)
  socket.join(socket.userId);
  
  // Rejoindre une room de conversation spécifique
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Utilisateur ${socket.userId} a rejoint la conversation ${conversationId}`);
  });
  
  // Écoute d'un nouveau message
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, text, receiverId } = data;
      // On importe les modèles ici pour éviter les erreurs de circularité
      const Conversation = require('./src/models/Conversation');
      const Message = require('./src/models/Message');
      
      // Vérifier que l'utilisateur fait partie de la conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId)) {
        return;
      }
      
      // Créer et sauvegarder le message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userId,
        text: text
      });
      
      // Mettre à jour la conversation (dernier message, timestamp)
      conversation.lastMessage = text;
      conversation.lastMessageTime = Date.now();
      await conversation.save();
      
      // Populer le sender pour l'envoyer au front
      const populatedMessage = await message.populate('sender', 'name avatar');
      
      // Émettre le message à tous les participants de la conversation
      conversation.participants.forEach(participantId => {
        io.to(participantId.toString()).emit('newMessage', populatedMessage);
      });
      
      // Alternative : émettre uniquement dans la room de conversation
      // io.to(conversationId).emit('newMessage', populatedMessage);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message socket:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ Socket déconnecté : ${socket.userId}`);
  });
});

// Attacher io à l'application Express pour l'utiliser dans les contrôleurs REST
app.set('io', io);

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});