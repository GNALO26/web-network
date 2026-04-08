import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const CallModal = ({ roomId, isVideo, otherUser, onClose }) => {
  const { user } = useAuth();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [peer, setPeer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const startTimeRef = useRef(Date.now());
  const localStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', ''));
    setSocket(newSocket);

    navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        if (isVideo) {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.current.push(event.data);
          };
          mediaRecorderRef.current.start(1000);
        }

        const isInitiator = true; // À adapter si besoin (peut être déterminé par un événement)
        const newPeer = new Peer({ initiator: isInitiator, stream, trickle: false });
        setPeer(newPeer);

        newPeer.on('signal', data => {
          newSocket.emit('call:signal', { roomId, signal: data, userId: user._id });
        });

        newPeer.on('stream', remoteStream => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        });

        newSocket.on('call:signal', ({ signal, userId }) => {
          if (userId !== user._id) {
            newPeer.signal(signal);
          }
        });
      })
      .catch(err => console.error('Erreur accès caméra/micro', err));

    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
          method: 'POST',
          body: formData
        })
          .then(res => res.json())
          .then(data => {
            newSocket.emit('call:leave', {
              roomId,
              userId: user._id,
              duration: callDuration,
              recordingUrl: data.secure_url,
              recordingType: isVideo ? 'video' : 'audio'
            });
          });
      } else {
        newSocket.emit('call:leave', { roomId, userId: user._id });
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peer) peer.destroy();
      newSocket.disconnect();
    };
  }, [roomId, isVideo, user._id]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !isCameraOff;
      setIsCameraOff(!isCameraOff);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="call-modal-overlay">
      <div className="call-modal">
        <div className="call-header">
          <div className="call-user">
            <img src={otherUser?.avatar || '/default-avatar.png'} alt={otherUser?.name} />
            <div>
              <h3>{otherUser?.name}</h3>
              <span>{formatDuration(callDuration)}</span>
            </div>
          </div>
          <button onClick={onClose} className="close-call-btn"><i className="fas fa-times"></i></button>
        </div>
        <div className="call-videos">
          <video ref={remoteVideoRef} autoPlay className="remote-video" />
          <video ref={localVideoRef} autoPlay muted className="local-video" />
        </div>
        <div className="call-controls">
          <button onClick={toggleMute} className={isMuted ? 'active' : ''}>
            <i className={`fas fa-microphone${isMuted ? '-slash' : ''}`}></i>
          </button>
          <button onClick={onClose} className="hangup"><i className="fas fa-phone-slash"></i></button>
          {isVideo && (
            <button onClick={toggleCamera} className={isCameraOff ? 'active' : ''}>
              <i className={`fas fa-video${isCameraOff ? '-slash' : ''}`}></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;