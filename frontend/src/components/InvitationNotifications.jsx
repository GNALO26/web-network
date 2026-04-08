import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const InvitationNotifications = () => {
  const [pending, setPending] = useState([]);
  const [show, setShow] = useState(false);
  const socket = useSocket();

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/invitations/pending');
      setPending(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPending();
    if (socket) {
      socket.on('notification', (data) => {
        if (data.type === 'invitation') fetchPending();
      });
      return () => socket.off('notification');
    }
  }, [socket]);

  const accept = async (invitationId) => {
    try {
      await api.put(`/invitations/${invitationId}/accept`);
      fetchPending();
    } catch (error) {
      console.error(error);
    }
  };

  const decline = async (invitationId) => {
    try {
      await api.put(`/invitations/${invitationId}/decline`);
      fetchPending();
    } catch (error) {
      console.error(error);
    }
  };

  if (pending.length === 0) return null;

  return (
    <div className="invitation-notifications">
      <button className="notification-bell" onClick={() => setShow(!show)}>
        🤝 {pending.length}
      </button>
      {show && (
        <div className="notification-dropdown">
          <h4>Demandes d'amis</h4>
          {pending.map(inv => (
            <div key={inv._id} className="invitation-item">
              <img src={inv.sender.avatar || '/default-avatar.png'} alt={inv.sender.name} />
              <span>{inv.sender.name}</span>
              <button onClick={() => accept(inv._id)}>Accepter</button>
              <button onClick={() => decline(inv._id)}>Refuser</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitationNotifications;