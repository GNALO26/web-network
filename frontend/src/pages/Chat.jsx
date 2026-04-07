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
  }, [conversationId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      if (socket) {
        socket.emit('sendMessage', { conversationId, text: newMessage });
        setNewMessage('');
      } else {
        const { data } = await api.post('/messages', { conversationId, text: newMessage });
        setMessages(prev => [...prev, data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!conversation) return <div>Chargement...</div>;

  const otherUser = conversation.participants.find(p => p._id !== user._id);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={otherUser.avatar || '/default-avatar.png'} alt={otherUser.name} />
        <h3>{otherUser.name}</h3>
      </div>
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg._id} className={`message ${msg.sender._id === user._id ? 'own' : 'other'}`}>
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
        />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
};

export default Chat;