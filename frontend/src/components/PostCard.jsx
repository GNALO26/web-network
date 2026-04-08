import { useState } from 'react';
import api from '../services/api';
import CommentSection from './CommentSection';
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '../context/AuthContext';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(() => post.likes?.includes(user?._id) || false);
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
          <h3>{post.author?.name}</h3>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>
      {post.content && <p className="post-content">{post.content}</p>}
      {post.mediaUrl && (
        post.mediaType === 'video' ? (
          <video src={post.mediaUrl} controls className="post-media" />
        ) : (
          <img src={post.mediaUrl} alt="media" className="post-media" />
        )
      )}
      <div className="post-actions">
        <button onClick={handleLike} className={liked ? 'liked' : ''}>
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