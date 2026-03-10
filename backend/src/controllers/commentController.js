const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Ajouter un commentaire à un post
// @route   POST /api/comments/:postId
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post non trouvé' });
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      post: post._id,
    });

    const populatedComment = await comment.populate('author', 'name avatar');
    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Obtenir les commentaires d'un post
// @route   GET /api/comments/:postId
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { addComment, getComments };