const CallRecord = require('../models/CallRecord');

// Récupérer tous les enregistrements (admin seulement)
const getAllCallRecords = async (req, res) => {
  try {
    const records = await CallRecord.find()
      .populate('participants', 'name email avatar')
      .sort({ startedAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les appels d'un utilisateur spécifique
const getUserCallRecords = async (req, res) => {
  try {
    const records = await CallRecord.find({ participants: req.params.userId })
      .populate('participants', 'name email avatar');
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Sauvegarder un enregistrement d'appel (appelé par le frontend à la fin de l'appel)
const saveCallRecord = async (req, res) => {
  try {
    const { participants, duration, recordingUrl, recordingType, initiatedBy } = req.body;
    const record = await CallRecord.create({
      participants,
      duration,
      recordingUrl,
      recordingType,
      initiatedBy,
      endedAt: new Date()
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getAllCallRecords, getUserCallRecords, saveCallRecord };