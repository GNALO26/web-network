const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Obtenir les messages d'une conversation
// @route   GET /api/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier que l'utilisateur fait partie de la conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Envoyer un message (via REST, utilisé aussi par Socket)
// @route   POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const userId = req.user._id;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text
    });
    
    // Mettre à jour lastMessage et lastMessageTime de la conversation
    conversation.lastMessage = text;
    conversation.lastMessageTime = Date.now();
    await conversation.save();
    
    const populatedMessage = await message.populate('sender', 'name avatar');
    
    // Émettre via Socket.io (on verra plus tard)
    const io = req.app.get('io');
    if (io) {
      const otherParticipantId = conversation.participants.find(
        id => id.toString() !== userId.toString()
      );
      io.to(otherParticipantId.toString()).emit('newMessage', populatedMessage);
      io.to(userId.toString()).emit('newMessage', populatedMessage);
    }
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Marquer les messages comme lus
// @route   PUT /api/messages/:conversationId/read
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMessages, sendMessage, markAsRead };