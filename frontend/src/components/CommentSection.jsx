import { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDate } from '../utils/dateFormatter';

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${postId}`);
      setComments(data);
    } catch (error) {
      console.error('Erreur chargement commentaires', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post(`/comments/${postId}`, { content: newComment });
      setComments([data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Erreur ajout commentaire', error);
    }
  };

  return (
    <div className="comment-section">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ajouter un commentaire..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button type="submit">Envoyer</button>
      </form>
      <div className="comments">
        {comments.map((comment) => (
          <div key={comment._id} className="comment">
            <img src={`/avatars/${comment.author.avatar}`} alt={comment.author.name} />
            <div>
              <strong>{comment.author.name}</strong>
              <p>{comment.content}</p>
              <small>{formatDate(comment.createdAt)}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;