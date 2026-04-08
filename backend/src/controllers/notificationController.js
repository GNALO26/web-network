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
    const { ids } = req.body;
    if (ids && ids.length > 0) {
      await Notification.updateMany({ _id: { $in: ids }, recipient: req.user._id }, { read: true });
    } else {
      await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    }
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getNotifications, markAsRead };