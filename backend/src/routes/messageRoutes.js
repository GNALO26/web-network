const express = require('express');
const { getMessages, sendMessage, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);
router.put('/:conversationId/read', protect, markAsRead);

module.exports = router;