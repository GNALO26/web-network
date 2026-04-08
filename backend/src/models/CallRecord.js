const mongoose = require('mongoose');

const callRecordSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  duration: Number, // en secondes
  recordingUrl: { type: String },
  recordingType: { type: String, enum: ['video', 'audio'] },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CallRecord', callRecordSchema);