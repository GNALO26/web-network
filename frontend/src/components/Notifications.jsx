import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);
  const socket = useSocket();

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

  const unreadCount = notifications.filter(n => !n.read).length;

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
              <div key={notif._id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                <img src={notif.sender.avatar || '/default-avatar.png'} alt={notif.sender.name} />
                <div>
                  <strong>{notif.sender.name}</strong>
                  <p>
                    {notif.type === 'invitation' && 'vous a envoyé une invitation'}
                    {notif.type === 'message' && 'vous a envoyé un message'}
                    {notif.type === 'like' && 'a aimé votre publication'}
                    {notif.type === 'comment' && 'a commenté votre publication'}
                  </p>
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