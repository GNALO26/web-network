const Post = require('../models/Post');

// @desc    Créer un post
// @route   POST /api/posts
const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.create({
      content,
      author: req.user._id,
    });
    const populatedPost = await post.populate('author', 'name avatar');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Obtenir tous les posts (fil d'actualité)
// @route   GET /api/posts
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name avatar' },
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Like/unlike un post
// @route   PUT /api/posts/:id/like
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }

    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      post.likes.push(req.user._id);
    }
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createPost, getPosts, likePost };