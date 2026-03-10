const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { updateAvatar } = require('../controllers/userController');

const router = express.Router();

router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;