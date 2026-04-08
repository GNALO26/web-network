import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        let userData;
        if (id && id !== currentUser._id) {
          const { data } = await api.get(`/users/${id}`);
          userData = data;
        } else {
          userData = currentUser;
        }
        setProfileUser(userData);
        if (userData._id === currentUser._id) {
          const { data } = await api.get('/invitations/friends');
          setFriends(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchData();
  }, [id, currentUser]);

  const startConversation = async (userId) => {
    try {
      const { data } = await api.post('/conversations', { otherUserId: userId });
      navigate(`/messages/${data._id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const sendInvitation = async (receiverId) => {
    try {
      await api.post('/invitations', { receiverId });
      alert('Invitation envoyée');
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    setUploading(true);
    try {
      const { data } = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser({ ...currentUser, avatar: data.avatar });
      setProfileUser({ ...profileUser, avatar: data.avatar });
      alert('Avatar mis à jour');
    } catch (error) {
      console.error(error);
      alert('Erreur upload');
    } finally {
      setUploading(false);
      setAvatarFile(null);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!profileUser) return <div className="error">Utilisateur non trouvé</div>;

  const isOwnProfile = profileUser._id === currentUser._id;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src={profileUser.avatar || '/default-avatar.png'} alt={profileUser.name} className="profile-avatar" />
        <h2>{profileUser.name}</h2>
        <p className="profile-email">{profileUser.email}</p>
        <p className="profile-bio">{profileUser.bio || 'Aucune bio'}</p>
        {isOwnProfile && (
          <form onSubmit={handleAvatarUpload} className="avatar-upload">
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} />
            <button type="submit" disabled={uploading}>Changer l'avatar</button>
          </form>
        )}
      </div>

      {!isOwnProfile && (
        <div className="profile-actions">
          <button onClick={() => startConversation(profileUser._id)} className="btn-message">💬 Message</button>
          <button onClick={() => sendInvitation(profileUser._id)} className="btn-invite">🤝 Inviter</button>
        </div>
      )}

      {isOwnProfile && (
        <div className="friends-section">
          <h3>Mes amis ({friends.length})</h3>
          <div className="friends-grid">
            {friends.map(friend => (
              <div key={friend._id} className="friend-card">
                <img src={friend.avatar || '/default-avatar.png'} alt={friend.name} className="friend-avatar" />
                <div>
                  <strong>{friend.name}</strong>
                  <button onClick={() => navigate(`/profile/${friend._id}`)}>Voir profil</button>
                  <button onClick={() => startConversation(friend._id)}>Message</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;