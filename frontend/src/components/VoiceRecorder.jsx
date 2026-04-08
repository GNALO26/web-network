// frontend/src/components/VoiceRecorder.jsx
import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const VoiceRecorder = ({ receiverId, onSent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioURL(url);
          setShowPreview(true);
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
      })
      .catch(err => console.error('Erreur micro', err));
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingTime(0);
      setShowPreview(false);
      setAudioURL(null);
    }
  };

  const sendRecording = async () => {
    if (!audioURL) return;
    const blob = await fetch(audioURL).then(r => r.blob());
    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    await api.post('/voice-messages', { receiverId, audioUrl: data.secure_url, duration: recordingTime });
    setShowPreview(false);
    setAudioURL(null);
    if (onSent) onSent();
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    startRecording();
  };
  const handleMouseUp = () => {
    if (isRecording) stopRecording();
  };
  const handleMouseLeave = () => {
    if (isRecording) cancelRecording();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="voice-recorder-container">
      {!showPreview ? (
        <button
          className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onTouchCancel={handleMouseLeave}
        >
          <i className="fas fa-microphone"></i>
          {isRecording && <span className="recording-time">{recordingTime}s</span>}
        </button>
      ) : (
        <div className="voice-preview">
          <audio controls src={audioURL} />
          <button onClick={sendRecording} className="send-voice-btn"><i className="fas fa-paper-plane"></i></button>
          <button onClick={cancelRecording} className="cancel-voice-btn"><i className="fas fa-trash"></i></button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;