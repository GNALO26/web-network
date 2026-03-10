const express = require('express');
const { createPost, getPosts, likePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createPost)
  .get(protect, getPosts);

router.put('/:id/like', protect, likePost);

module.exports = router;