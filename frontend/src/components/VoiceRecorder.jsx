import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const VoiceRecorder = ({ receiverId, onSent }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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
        mediaRecorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', blob, 'voice.webm');
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
            method: 'POST',
            body: formData
          });
          const uploadData = await uploadRes.json();
          await api.post('/voice-messages', { receiverId, audioUrl: uploadData.secure_url, duration: recordingTime });
          if (onSent) onSent();
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
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
    }
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
      <button
        className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
        title="Message vocal (maintenir)"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchCancel={handleMouseLeave}
      >
        <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
        {isRecording && <span className="recording-time">{recordingTime}s</span>}
      </button>
    </div>
  );
};

export default VoiceRecorder;