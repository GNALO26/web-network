import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const socket = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get('/conversations'),
          api.get(`/messages/${conversationId}`)
        ]);
        const found = convRes.data.find(c => c._id === conversationId);
        setConversation(found);
        setMessages(msgRes.data);
        await api.put(`/messages/${conversationId}/read`);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();

    if (socket) {
      socket.emit('joinConversation', conversationId);
      socket.on('newMessage', (msg) => {
        if (msg.conversation === conversationId) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender._id !== user._id) {
            api.put(`/messages/${conversationId}/read`);
          }
        }
      });
      return () => socket.off('newMessage');
    }
  }, [conversationId, socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const messageText = newMessage;
    setNewMessage(''); // Optimiste
    try {
      if (socket) {
        socket.emit('sendMessage', { conversationId, text: messageText });
      } else {
        const { data } = await api.post('/messages', { conversationId, text: messageText });
        setMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      // Réinsérer le message en cas d'erreur
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  if (!conversation) return <div className="loading">Chargement...</div>;

  const otherUser = conversation.participants.find(p => p._id !== user._id);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img 
          src={otherUser?.avatar || '/default-avatar.png'} 
          alt={otherUser?.name} 
          className="chat-avatar"
          onError={(e) => e.target.src = '/default-avatar.png'}
        />
        <h3>{otherUser?.name || 'Utilisateur'}</h3>
      </div>
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg._id} className={`message ${msg.sender?._id === user?._id ? 'own' : 'other'}`}>
            <div className="message-text">{msg.text}</div>
            <div className="message-time">{new Date(msg.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending}>Envoyer</button>
      </form>
    </div>
  );
};

export default Chat;