import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      const token = localStorage.getItem('token');
      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });
      newSocket.on('connect', () => console.log('Socket connecté'));
      newSocket.on('connect_error', (err) => console.error('Socket error:', err));
      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [user, loading]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};