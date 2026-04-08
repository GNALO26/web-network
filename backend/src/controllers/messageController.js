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
    conversation.lastMessage = text;
    conversation.lastMessageTime = Date.now();
    await conversation.save();
    const populatedMessage = await message.populate('sender', 'name avatar');
    const otherId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
    if (otherId) {
      await Notification.create({
        recipient: otherId,
        sender: req.user._id,
        type: 'message',
        referenceId: message._id
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

module.exports = { getMessages, sendMessage, markAsRead };