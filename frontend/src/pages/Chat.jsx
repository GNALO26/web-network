// frontend/src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VoiceRecorder from '../components/VoiceRecorder';
import VideoCall from '../components/VideoCall';
import { useState } from 'react';

const Chat = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const socket = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const [showCall, setShowCall] = useState(false);
  const [callType, setCallType] = useState(null);

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
        if (msg.conversation === conversationId && msg.sender._id !== user._id) {
          setMessages(prev => [...prev, msg]);
          api.put(`/messages/${conversationId}/read`);
        }
      });
      return () => socket.off('newMessage');
    }
  }, [conversationId, socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const messageText = newMessage;
    setNewMessage('');
    const tempMessage = {
      _id: Date.now(),
      text: messageText,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      conversation: conversationId
    };
    setMessages(prev => [...prev, tempMessage]);
    try {
      if (socket) {
        socket.emit('sendMessage', { conversationId, text: messageText });
      } else {
        const { data } = await api.post('/messages', { conversationId, text: messageText });
        setMessages(prev => prev.map(m => m._id === tempMessage._id ? data : m));
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    setSending(true);
    const tempId = Date.now();
    const fileType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'document');
    const tempMessage = {
      _id: tempId,
      text: '',
      fileUrl: URL.createObjectURL(file),
      fileType,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      conversation: conversationId,
      isTemp: true
    };
    <div className="call-buttons">
  <button onClick={() => { setCallType('audio'); setShowCall(true); }}>🎙️ Appel audio</button>
  <button onClick={() => { setCallType('video'); setShowCall(true); }}>📹 Appel vidéo</button>
</div>
{showCall && (
  <VideoCall roomId={conversationId} isVideo={callType === 'video'} onEnd={() => setShowCall(false)} />
)}
    setMessages(prev => [...prev, tempMessage]);
    try {
      const { data } = await api.post('/messages/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => prev.map(m => m._id === tempId ? data : m));
    } catch (error) {
      console.error('Erreur upload fichier:', error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      alert('Erreur lors de l\'envoi du fichier');
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!conversation) return <div className="loading">Chargement...</div>;

  const otherUser = conversation.participants?.find(p => p._id !== user._id);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img src={otherUser?.avatar || '/default-avatar.png'} alt={otherUser?.name} className="chat-avatar" />
        <h3>{otherUser?.name || 'Utilisateur'}</h3>
      </div>
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg._id} className={`message ${msg.sender?._id === user?._id ? 'own' : 'other'}`}>
            {msg.text && <div className="message-text">{msg.text}</div>}
            {msg.fileUrl && (
              <div className="message-file">
                {msg.fileType === 'image' && <img src={msg.fileUrl} alt="image" className="message-image" />}
                {msg.fileType === 'video' && <video src={msg.fileUrl} controls className="message-video" />}
                {msg.fileType === 'document' && (
                  <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="message-document">
                    📄 Télécharger le fichier
                  </a>
                )}
              </div>
            )}
            <div className="message-time">{new Date(msg.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendText} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          disabled={sending}
        />
        <VoiceRecorder receiverId={otherUser._id} onSent={() => {}} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending}>
          📎
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
        <button type="submit" disabled={sending}>Envoyer</button>
      </form>
    </div>
  );
};

export default Chat;