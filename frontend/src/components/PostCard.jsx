import { useState } from 'react';
import api from '../services/api';
import CommentSection from './CommentSection';
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '../context/AuthContext';

const PostCard = ({ post, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [liked, setLiked] = useState(post.likes.includes(JSON.parse(localStorage.getItem('quizUser'))._id));
  const { user } = useAuth();

  const handleLike = async () => {
    try {
      await api.put(`/posts/${post._id}/like`);
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    } catch (error) {
      console.error('Erreur like', error);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <img src={post.author.avatar} alt={post.author.name} />
        <div>
          <h3>{post.author.name}</h3>
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