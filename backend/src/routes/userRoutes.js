const express = require('express');
const { getUsers, getUserById, updateAvatar } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;