import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    // Establish socket connection when user is authed, disconnect when logged out
    const socketUrl = window.location.origin.includes('5173') ? 'http://localhost:5000' : window.location.origin;
    
    const newSocket = io(socketUrl, {
      autoConnect: true,
      withCredentials: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.io connected:', newSocket.id);
    });

    return () => {
      newSocket.close();
      console.log('Socket.io connection closed');
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
