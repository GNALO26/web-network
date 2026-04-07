import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (id && id !== currentUser._id) {
        try {
          const { data } = await api.get(`/users/${id}`);
          setProfileUser(data);
        } catch (error) {
          console.error(error);
        }
      } else {
        setProfileUser(currentUser);
      }
    };
    fetchUser();
  }, [id, currentUser]);

  const startConversation = async () => {
    try {
      const { data } = await api.post('/conversations', { otherUserId: profileUser._id });
      navigate(`/messages/${data._id}`);
    } catch (error) {
      console.error(error);
    }
  };

  if (!profileUser) return <div>Chargement...</div>;

  const isOwnProfile = profileUser._id === currentUser._id;

  return (
    <div className="profile-container">
      <h2>{isOwnProfile ? 'Mon profil' : `Profil de ${profileUser.name}`}</h2>
      <div className="profile-info">
        <img src={profileUser.avatar} alt={profileUser.name} style={{ width: '100px', borderRadius: '50%' }} />
        <p><strong>Nom :</strong> {profileUser.name}</p>
        <p><strong>Email :</strong> {profileUser.email}</p>
        <p><strong>Bio :</strong> {profileUser.bio || 'Aucune bio'}</p>
        {!isOwnProfile && (
          <button onClick={startConversation}>Envoyer un message</button>
        )}
      </div>
    </div>
  );
};

export default Profile;