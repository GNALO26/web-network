const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post non trouvé' });
    const comment = await Comment.create({
      content,
      author: req.user._id,
      post: post._id
    });
    const populatedComment = await comment.populate('author', 'name avatar');
    // Notification à l'auteur du post
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        referenceId: post._id  // ← pour rediriger vers le post
      });
      const io = req.app.get('io');
      if (io) io.to(post.author.toString()).emit('notification', { type: 'comment' });
    }
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Erreur addComment:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Erreur getComments:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { addComment, getComments };