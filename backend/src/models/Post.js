const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: { type: String, trim: true, default: '' },
  mediaUrl: { type: String, default: null },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);