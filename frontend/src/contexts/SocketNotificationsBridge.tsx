/**
 * Bridge que escuta eventos de socket e os traduz em notificações visuais.
 * Deve ser renderizado dentro de ambos SocketProvider e NotificationsProvider.
 */
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from './useSocket';
import { useNotifications } from './NotificationsContext';

export const SocketNotificationsBridge: React.FC = () => {
  const socket = useSocket();
  const location = useLocation();
  const { setRoomsActivity, setUnreadMessages } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    // Sinaliza nova atividade em sala quando o estado da sala é atualizado
    // e o usuário NÃO está já na tela de salas
    const onRoomStateUpdated = () => {
      const isOnLobbyPage = location.pathname === '/lobby' || location.pathname.includes('/room/');
      if (!isOnLobbyPage) {
        setRoomsActivity(true);
      }
    };

    // Convite direto para sala (futuro: backend pode emitir 'room_invited')
    const onRoomInvited = () => {
      setRoomsActivity(true);
    };

    // Nova mensagem recebida (futuro: backend pode emitir 'new_message')
    const onNewMessage = (data: { count?: number }) => {
      const isOnMessagesPage = location.pathname === '/messages';
      if (!isOnMessagesPage) {
        setUnreadMessages(data.count ?? 1);
      }
    };

    socket.on('room_state_updated', onRoomStateUpdated);
    socket.on('room_invited', onRoomInvited);
    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('room_state_updated', onRoomStateUpdated);
      socket.off('room_invited', onRoomInvited);
      socket.off('new_message', onNewMessage);
    };
  }, [socket, location.pathname, setRoomsActivity, setUnreadMessages]);

  return null;
};
