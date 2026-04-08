import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);
  const socket = useSocket();
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotifs();
    if (socket) {
      socket.on('notification', fetchNotifs);
      return () => socket.off('notification');
    }
  }, [socket]);

  const markAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadIds.length === 0) return;
    try {
      await api.put('/notifications/read', { ids: unreadIds });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleClick = (notif) => {
    setShow(false);
    markAsRead(); // marquer comme lue au clic
    // Redirection selon le type
    if (notif.type === 'invitation') {
      navigate('/explore');
    } else if (notif.type === 'message') {
      // Rediriger vers la conversation concernée
      if (notif.referenceId) {
        navigate(`/messages/${notif.referenceId}`);
      } else {
        navigate('/conversations');
      }
    } else if (notif.type === 'like' || notif.type === 'comment') {
      // Rediriger vers le post concerné (page d'accueil avec ancrage)
      if (notif.referenceId) {
        navigate(`/?postId=${notif.referenceId}`);
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationText = (notif) => {
    switch (notif.type) {
      case 'invitation': return 'vous a envoyé une invitation';
      case 'message': return 'vous a envoyé un message';
      case 'like': return 'a aimé votre publication';
      case 'comment': return 'a commenté votre publication';
      default: return 'a interagi avec vous';
    }
  };

  return (
    <div className="notifications-container">
      <button className="notification-bell" onClick={() => { setShow(!show); if (!show) markAsRead(); }}>
        🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      {show && (
        <div className="notifications-dropdown">
          {notifications.length === 0 ? (
            <div className="no-notif">Aucune notification</div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif._id} 
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                onClick={() => handleClick(notif)}
                style={{ cursor: 'pointer' }}
              >
                <img src={notif.sender?.avatar || '/default-avatar.png'} alt={notif.sender?.name} />
                <div>
                  <strong>{notif.sender?.name}</strong>
                  <p>{getNotificationText(notif)}</p>
                  <small>{new Date(notif.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;