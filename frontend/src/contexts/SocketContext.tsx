import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { SocketContext } from './SocketContextValue';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl.replace(/\/$/, '');
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || baseUrl, { reconnection: true, reconnectionAttempts: Infinity, timeout: 8000 });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
