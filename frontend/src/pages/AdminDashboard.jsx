import { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data } = await api.get('/calls/admin/records');
        setRecords(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="admin-dashboard">
      <h1>📞 Enregistrements des appels</h1>
      <div className="records-grid">
        {records.map(record => (
          <div key={record._id} className="record-card">
            <h3>{record.recordingType === 'video' ? '🎥 Appel vidéo' : '🎙️ Appel audio'}</h3>
            <p><strong>Participants :</strong> {record.participants.map(p => p.name).join(', ')}</p>
            <p><strong>Durée :</strong> {Math.floor(record.duration / 60)}:{String(record.duration % 60).padStart(2, '0')}</p>
            <p><strong>Date :</strong> {new Date(record.startedAt).toLocaleString()}</p>
            {record.recordingUrl && (
              record.recordingType === 'video' ? (
                <video controls src={record.recordingUrl} className="record-video" />
              ) : (
                <audio controls src={record.recordingUrl} className="record-audio" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;