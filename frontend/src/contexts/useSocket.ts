import { useContext } from 'react';
import { SocketContext } from './SocketContextValue';

export const useSocket = () => {
  return useContext(SocketContext);
};
