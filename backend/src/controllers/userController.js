const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('name email avatar bio');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier' });
    const user = await User.findById(req.user._id);
    user.avatar = req.file.path;
    await user.save();
    res.json({ avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getUsers, getUserById, updateAvatar };