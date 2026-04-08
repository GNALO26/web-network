import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const VideoCall = ({ roomId, isVideo, onEnd }) => {
  const { user } = useAuth();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [peer, setPeer] = useState(null);
  const [socket, setSocket] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  useEffect(() => {
    const newPeer = new Peer(user._id);
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', ''));
    setPeer(newPeer);
    setSocket(newSocket);

    newSocket.emit('call:join', { roomId, userId: user._id, isVideo });

    navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo })
      .then(stream => {
        localVideoRef.current.srcObject = stream;
        if (isVideo) {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.current.push(event.data);
          };
          mediaRecorderRef.current.start(1000);
        }
      });

    newPeer.on('call', incomingCall => {
      navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo })
        .then(stream => {
          incomingCall.answer(stream);
          incomingCall.on('stream', remoteStream => {
            remoteVideoRef.current.srcObject = remoteStream;
          });
        });
    });

    newSocket.on('call:offer', ({ offer, userId }) => {
      // Utiliser PeerJS pour gérer l'offre (normalement déjà fait)
    });
    newSocket.on('call:answer', ({ answer }) => {});
    newSocket.on('call:ice-candidate', ({ candidate }) => {});

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, {
          method: 'POST',
          body: formData
        })
          .then(res => res.json())
          .then(data => {
            newSocket.emit('call:leave', {
              roomId,
              userId: user._id,
              duration: Math.floor((Date.now() - startTime) / 1000),
              recordingUrl: data.secure_url,
              recordingType: isVideo ? 'video' : 'audio'
            });
          });
      } else {
        newSocket.emit('call:leave', { roomId, userId: user._id });
      }
      newSocket.disconnect();
      peer.destroy();
    };
  }, [roomId]);

  return (
    <div className="video-call-container">
      <video ref={localVideoRef} autoPlay muted className="local-video" />
      <video ref={remoteVideoRef} autoPlay className="remote-video" />
      <button onClick={onEnd}>Raccrocher</button>
    </div>
  );
};

export default VideoCall;