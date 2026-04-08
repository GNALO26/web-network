const express = require('express');
const { getMessages, sendMessage, sendFileMessage, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/file', protect, upload.single('file'), sendFileMessage); // nouvelle route
router.put('/:conversationId/read', protect, markAsRead);

module.exports = router;