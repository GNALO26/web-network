import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ConversationsList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await api.get('/conversations');
        setConversations(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="conversations-container">
      <h2>Mes conversations</h2>
      {conversations.length === 0 ? (
        <p>Aucune conversation. Commencez à discuter avec un ami depuis son profil.</p>
      ) : (
        conversations.map(conv => {
          const otherUser = conv.participants.find(p => p._id !== JSON.parse(localStorage.getItem('quizUser'))._id);
          return (
            <Link to={`/messages/${conv._id}`} key={conv._id} className="conversation-card">
              <img src={otherUser.avatar} alt={otherUser.name} />
              <div>
                <h4>{otherUser.name}</h4>
                <p>{conv.lastMessage || 'Nouvelle conversation'}</p>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
};

export default ConversationsList;