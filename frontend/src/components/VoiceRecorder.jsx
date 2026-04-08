import { useState, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import api from '../services/api';

const VoiceRecorder = ({ receiverId, onSent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });

  const handleSend = async () => {
    if (!mediaBlobUrl) return;
    const blob = await fetch(mediaBlobUrl).then(r => r.blob());
    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');
    // Upload vers Cloudinary
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    await api.post('/voice-messages', { receiverId, audioUrl: data.secure_url, duration: 0 });
    if (onSent) onSent();
    setAudioUrl(null);
  };

  return (
    <div className="voice-recorder">
      <button onClick={startRecording} disabled={status === 'recording'}>🎙️</button>
      <button onClick={stopRecording} disabled={status !== 'recording'}>⏹️</button>
      {mediaBlobUrl && <audio controls src={mediaBlobUrl} />}
      <button onClick={handleSend} disabled={!mediaBlobUrl}>Envoyer</button>
    </div>
  );
};

export default VoiceRecorder;