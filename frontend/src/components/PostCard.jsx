import { useState } from 'react';
import api from '../services/api';
import CommentSection from './CommentSection';
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '../context/AuthContext';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  
  // État local pour le like (synchronisé avec le post reçu)
  const [liked, setLiked] = useState(() => {
    if (user && post.likes) {
      return post.likes.includes(user._id);
    }
    return false;
  });
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  const handleLike = async () => {
    try {
      await api.put(`/posts/${post._id}/like`);
      const newLiked = !liked;
      setLiked(newLiked);
      setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Erreur like', error);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <img src={post.author?.avatar || '/default-avatar.png'} alt={post.author?.name} />
        <div>
          <h3>{post.author?.name || 'Utilisateur'}</h3>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>
      <p className="post-content">{post.content}</p>
      <div className="post-actions">
        <button onClick={handleLike}>
          {liked ? '❤️' : '🤍'} {likesCount}
        </button>
        <button onClick={() => setShowComments(!showComments)}>
          💬 Commentaires {post.commentCount || 0}
        </button>
      </div>
      {showComments && <CommentSection postId={post._id} />}
    </div>
  );
};

export default PostCard;