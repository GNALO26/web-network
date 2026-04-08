const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Notification = require('../models/Notification');

const sendInvitation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;
    if (senderId.toString() === receiverId) return res.status(400).json({ message: 'Vous ne pouvez pas vous inviter vous-même' });
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const existing = await Invitation.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });
    if (existing) {
      if (existing.status === 'pending') return res.status(400).json({ message: 'Invitation déjà envoyée en attente' });
      if (existing.status === 'accepted') return res.status(400).json({ message: 'Vous êtes déjà amis' });
    }
    const invitation = await Invitation.create({ sender: senderId, receiver: receiverId });
    await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: 'invitation',
      referenceId: invitation._id
    });
    const io = req.app.get('io');
    if (io) io.to(receiverId.toString()).emit('notification', { type: 'invitation' });
    res.status(201).json(invitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) return res.status(404).json({ message: 'Invitation non trouvée' });
    if (invitation.receiver.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Non autorisé' });
    invitation.status = 'accepted';
    await invitation.save();
    res.json({ message: 'Invitation acceptée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const declineInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) return res.status(404).json({ message: 'Invitation non trouvée' });
    if (invitation.receiver.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Non autorisé' });
    invitation.status = 'declined';
    await invitation.save();
    res.json({ message: 'Invitation refusée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ receiver: req.user._id, status: 'pending' })
      .populate('sender', 'name avatar email');
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getFriends = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      $or: [
        { sender: req.user._id, status: 'accepted' },
        { receiver: req.user._id, status: 'accepted' }
      ]
    }).populate('sender receiver', 'name avatar email');
    const friends = invitations.map(inv =>
      inv.sender._id.toString() === req.user._id.toString() ? inv.receiver : inv.sender
    );
    res.json(friends);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { sendInvitation, acceptInvitation, declineInvitation, getPendingInvitations, getFriends };