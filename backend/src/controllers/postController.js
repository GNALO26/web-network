const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let mediaUrl = null, mediaType = null;
    if (req.file) {
      mediaUrl = req.file.path;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }
    const post = await Post.create({
      content,
      mediaUrl,
      mediaType,
      author: req.user._id
    });
    const populatedPost = await post.populate('author', 'name avatar');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });
    const postsWithCount = await Promise.all(posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ post: post._id });
      return { ...post.toObject(), commentCount };
    }));
    res.json(postsWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post non trouvé' });
    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
      // Créer notification pour l'auteur du post
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          referenceId: post._id
        });
        const io = req.app.get('io');
        if (io) io.to(post.author.toString()).emit('notification', {});
      }
    }
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createPost, getPosts, likePost };