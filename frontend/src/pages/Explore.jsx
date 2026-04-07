import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, friendsRes] = await Promise.all([
          api.get('/users'),
          api.get('/invitations/friends')
        ]);
        setUsers(usersRes.data.filter(u => u._id !== user._id));
        setFriends(friendsRes.data.map(f => f._id));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const sendInvitation = async (receiverId) => {
    try {
      await api.post('/invitations', { receiverId });
      setPendingSent(prev => [...prev, receiverId]);
      alert('Invitation envoyée');
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const startConversation = async (userId) => {
    try {
      const { data } = await api.post('/conversations', { otherUserId: userId });
      navigate(`/messages/${data._id}`);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="explore-container">
      <h2>Explorer les utilisateurs</h2>
      <div className="users-grid">
        {users.map(u => {
          const isFriend = friends.includes(u._id);
          const isPending = pendingSent.includes(u._id);
          return (
            <div key={u._id} className="user-card">
              <img src={u.avatar || '/default-avatar.png'} alt={u.name} />
              <h4>{u.name}</h4>
              <p>{u.email}</p>
              <div className="user-actions">
                {isFriend ? (
                  <button onClick={() => startConversation(u._id)} className="btn-message">💬 Message</button>
                ) : isPending ? (
                  <button disabled className="btn-pending">Invitation envoyée</button>
                ) : (
                  <>
                    <button onClick={() => sendInvitation(u._id)} className="btn-invite">🤝 Inviter</button>
                    <button onClick={() => startConversation(u._id)} className="btn-message">Message</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Explore;