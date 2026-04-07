const express = require('express');
const { createPost, getPosts, likePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
router.route('/')
  .post(protect, upload.single('media'), createPost)
  .get(protect, getPosts);
router.put('/:id/like', protect, likePost);

module.exports = router;