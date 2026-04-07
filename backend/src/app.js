const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

module.exports = app;