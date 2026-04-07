const Conversation = require('../models/Conversation');
const User = require('../models/User');

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name avatar')
      .sort({ lastMessageTime: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const createOrGetConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user._id;
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    let conversation = await Conversation.findOne({ participants: { $all: [userId, otherUserId] } })
      .populate('participants', 'name avatar');
    if (!conversation) {
      conversation = await Conversation.create({ participants: [userId, otherUserId] });
      conversation = await conversation.populate('participants', 'name avatar');
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getConversations, createOrGetConversation };