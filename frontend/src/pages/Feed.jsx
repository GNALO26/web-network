import { useState, useEffect } from 'react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);
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
    if (!newPost.trim() && !mediaFile) return;
    const formData = new FormData();
    formData.append('content', newPost);
    if (mediaFile) formData.append('media', mediaFile);
    setUploading(true);
    try {
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPosts([data, ...posts]);
      setNewPost('');
      setMediaFile(null);
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
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
        <div className="media-input">
          <input type="file" accept="image/*,video/*" onChange={(e) => setMediaFile(e.target.files[0])} />
          {mediaFile && <span>{mediaFile.name}</span>}
        </div>
        <button type="submit" disabled={uploading}>{uploading ? 'Publication...' : 'Publier'}</button>
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