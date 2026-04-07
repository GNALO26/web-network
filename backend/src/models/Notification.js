const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['invitation', 'message', 'like', 'comment'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);