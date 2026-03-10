import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, setUser } = useAuth(); // il faut que setUser soit exposé par le contexte
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    setUploading(true);
    try {
      const { data } = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Mettre à jour l'utilisateur dans le contexte
      setUser({ ...user, avatar: data.avatar });
      setAvatarFile(null);
    } catch (error) {
      console.error('Erreur upload', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-container">
      <h2>Profil</h2>
      <div className="profile-info">
        <img src={user.avatar} alt={user.name} style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
        <p><strong>Nom :</strong> {user.name}</p>
        <p><strong>Email :</strong> {user.email}</p>
        <p><strong>Bio :</strong> {user.bio || 'Aucune bio'}</p>
        
        <form onSubmit={handleUpload}>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button type="submit" disabled={!avatarFile || uploading}>
            {uploading ? 'Upload...' : 'Changer la photo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;