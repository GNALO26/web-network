import { useState, useEffect } from 'react';
import api from '../services/api';

const InvitationNotifications = () => {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { data } = await api.get('/invitations/pending');
        setPending(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPending();
  }, []);

  const accept = async (invitationId) => {
    try {
      await api.put(`/invitations/${invitationId}/accept`);
      setPending(pending.filter(inv => inv._id !== invitationId));
      alert('Invitation acceptée');
    } catch (error) {
      console.error(error);
    }
  };

  const decline = async (invitationId) => {
    try {
      await api.put(`/invitations/${invitationId}/decline`);
      setPending(pending.filter(inv => inv._id !== invitationId));
      alert('Invitation refusée');
    } catch (error) {
      console.error(error);
    }
  };

  if (pending.length === 0) return null;

  return (
    <div className="invitation-notifications">
      <span className="notification-bell">🔔</span>
      <div className="notification-dropdown">
        <h4>Demandes d'amis</h4>
        {pending.map(inv => (
          <div key={inv._id} className="invitation-item">
            <img src={inv.sender.avatar} alt={inv.sender.name} />
            <span>{inv.sender.name}</span>
            <button onClick={() => accept(inv._id)}>Accepter</button>
            <button onClick={() => decline(inv._id)}>Refuser</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvitationNotifications;