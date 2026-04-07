const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Obtenir toutes les conversations de l'utilisateur connecté
// @route   GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'name avatar')
    .sort({ lastMessageTime: -1 });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Créer ou récupérer une conversation avec un autre utilisateur
// @route   POST /api/conversations
const createOrGetConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user._id;

    // Vérifier que l'autre utilisateur existe
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Chercher une conversation existante entre les deux
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] }
    }).populate('participants', 'name avatar');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, otherUserId]
      });
      conversation = await conversation.populate('participants', 'name avatar');
    }

    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getConversations, createOrGetConversation };