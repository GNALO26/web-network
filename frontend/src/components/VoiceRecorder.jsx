import { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import api from '../services/api';

const VoiceRecorder = ({ receiverId, onSent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });

  const handleSend = async () => {
    if (!mediaBlobUrl) return;
    const blob = await fetch(mediaBlobUrl).then(r => r.blob());
    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    await api.post('/voice-messages', { receiverId, audioUrl: data.secure_url, duration: 0 });
    if (onSent) onSent();
  };

  return (
    <div className="voice-recorder">
      {status === 'recording' ? (
        <button onClick={stopRecording} className="recording-btn">
          <i className="fas fa-stop"></i>
        </button>
      ) : (
        <button onClick={startRecording} className="record-btn">
          <i className="fas fa-microphone"></i>
        </button>
      )}
      {mediaBlobUrl && (
        <div className="voice-preview">
          <audio controls src={mediaBlobUrl} />
          <button onClick={handleSend} className="send-voice-btn">
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;