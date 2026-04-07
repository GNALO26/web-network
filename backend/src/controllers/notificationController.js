const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, _id: { $in: req.body.ids } },
      { read: true }
    );
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const createNotification = async (recipientId, senderId, type, referenceId) => {
  const notification = new Notification({ recipient: recipientId, sender: senderId, type, referenceId });
  await notification.save();
  return notification.populate('sender', 'name avatar');
};

module.exports = { getNotifications, markAsRead, createNotification };