const VoiceMessage = require('../models/VoiceMessage');

const sendVoiceMessage = async (req, res) => {
  try {
    const { receiverId, audioUrl, duration } = req.body;
    const voiceMessage = await VoiceMessage.create({
      sender: req.user._id,
      receiver: receiverId,
      audioUrl,
      duration
    });
    // Notification en temps réel (Socket.io)
    const io = req.app.get('io');
    if (io) io.to(receiverId).emit('new-voice-message', voiceMessage);
    res.status(201).json(voiceMessage);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getUnreadVoiceMessages = async (req, res) => {
  try {
    const messages = await VoiceMessage.find({ receiver: req.user._id, isRead: false })
      .populate('sender', 'name avatar');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const markVoiceMessageAsRead = async (req, res) => {
  try {
    await VoiceMessage.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Message vocal marqué comme lu' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { sendVoiceMessage, getUnreadVoiceMessages, markVoiceMessageAsRead };