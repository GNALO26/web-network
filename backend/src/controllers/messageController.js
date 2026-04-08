// backend/src/controllers/messageController.js
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation non trouvée' });
    if (!conversation.participants.includes(req.user._id)) return res.status(403).json({ message: 'Non autorisé' });
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation non trouvée' });
    if (!conversation.participants.includes(req.user._id)) return res.status(403).json({ message: 'Non autorisé' });
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text
    });
    conversation.lastMessage = text || '[Fichier]';
    conversation.lastMessageTime = Date.now();
    await conversation.save();
    const populatedMessage = await message.populate('sender', 'name avatar');
    const otherId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
    if (otherId) {
      await Notification.create({
        recipient: otherId,
        sender: req.user._id,
        type: 'message',
        referenceId: conversationId
      });
      const io = req.app.get('io');
      if (io) io.to(otherId.toString()).emit('newMessage', populatedMessage);
    }
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// NOUVEAU : envoi de fichier
const sendFileMessage = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé' });
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation non trouvée' });
    if (!conversation.participants.includes(req.user._id)) return res.status(403).json({ message: 'Non autorisé' });
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) fileType = 'image';
    else if (req.file.mimetype.startsWith('video/')) fileType = 'video';
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: '',
      fileUrl: req.file.path,
      fileType
    });
    conversation.lastMessage = `[${fileType === 'image' ? 'Image' : fileType === 'video' ? 'Vidéo' : 'Fichier'}]`;
    conversation.lastMessageTime = Date.now();
    await conversation.save();
    const populatedMessage = await message.populate('sender', 'name avatar');
    const otherId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
    if (otherId) {
      await Notification.create({
        recipient: otherId,
        sender: req.user._id,
        type: 'message',
        referenceId: conversationId
      });
      const io = req.app.get('io');
      if (io) io.to(otherId.toString()).emit('newMessage', populatedMessage);
    }
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMessages, sendMessage, sendFileMessage, markAsRead };