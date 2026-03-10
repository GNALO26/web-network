import { useState, useEffect } from 'react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/posts');
      setPosts(data);
    } catch (error) {
      console.error('Erreur chargement posts', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    try {
      const { data } = await api.post('/posts', { content: newPost });
      setPosts([data, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Erreur création post', error);
    }
  };

  return (
    <div className="feed-container">
      <h1>Fil d'actualité</h1>
      <form onSubmit={handleSubmit} className="post-form">
        <textarea
          placeholder="Quoi de neuf ?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          rows="3"
        />
        <button type="submit">Publier</button>
      </form>
      <div className="posts">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} onUpdate={fetchPosts} />
        ))}
      </div>
    </div>
  );
};

export default Feed;