const User = require('../models/User');

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    const user = await User.findById(req.user._id);
    user.avatar = req.file.path; // Cloudinary renvoie l'URL
    await user.save();
    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { updateAvatar };