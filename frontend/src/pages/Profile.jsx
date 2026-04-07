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

        // Si c'est notre propre profil, récupérer la liste des amis
        if (userData._id === currentUser._id) {
          const { data } = await api.get('/invitations/friends');
          setFriends(data);
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
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
      console.error('Erreur création conversation:', error);
    }
  };

  const sendInvitation = async (receiverId) => {
    try {
      await api.post('/invitations', { receiverId });
      alert('Invitation envoyée !');
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de l’envoi');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!profileUser) return <div className="error">Utilisateur non trouvé</div>;

  const isOwnProfile = profileUser._id === currentUser._id;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img
          src={profileUser.avatar || '/default-avatar.png'}
          alt={profileUser.name}
          className="profile-avatar"
        />
        <h2>{profileUser.name}</h2>
        <p className="profile-email">{profileUser.email}</p>
        <p className="profile-bio">{profileUser.bio || 'Aucune bio pour le moment'}</p>
      </div>

      {!isOwnProfile && (
        <div className="profile-actions">
          <button onClick={() => startConversation(profileUser._id)} className="btn-message">
            💬 Envoyer un message
          </button>
          <button onClick={() => sendInvitation(profileUser._id)} className="btn-invite">
            🤝 Inviter en ami
          </button>
        </div>
      )}

      {isOwnProfile && (
        <div className="friends-section">
          <h3>Mes amis ({friends.length})</h3>
          {friends.length === 0 ? (
            <p>Vous n'avez pas encore d'amis. Explorez et invitez d'autres utilisateurs !</p>
          ) : (
            <div className="friends-grid">
              {friends.map((friend) => (
                <div key={friend._id} className="friend-card">
                  <img src={friend.avatar || '/default-avatar.png'} alt={friend.name} />
                  <div>
                    <strong>{friend.name}</strong>
                    <button onClick={() => navigate(`/profile/${friend._id}`)}>Voir profil</button>
                    <button onClick={() => startConversation(friend._id)}>Message</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;