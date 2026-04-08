const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('name email avatar bio');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    // Vérification de la présence du fichier
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    // Vérification que Cloudinary a bien retourné une URL
    if (!req.file.path) {
      console.error('Cloudinary n\'a pas retourné de path:', req.file);
      return res.status(500).json({ message: 'Erreur lors du téléversement vers Cloudinary' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    user.avatar = req.file.path;
    await user.save();
    
    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Erreur updateAvatar:', error);
    res.status(500).json({ message: 'Erreur serveur: ' + error.message });
  }
};

module.exports = { getUsers, getUserById, updateAvatar };