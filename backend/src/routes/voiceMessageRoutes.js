const express = require('express');
const { sendVoiceMessage, getUnreadVoiceMessages, markVoiceMessageAsRead } = require('../controllers/voiceMessageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/', protect, sendVoiceMessage);
router.get('/unread', protect, getUnreadVoiceMessages);
router.put('/:id/read', protect, markVoiceMessageAsRead);

module.exports = router;