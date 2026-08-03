/**
 * Bridge que escuta eventos de socket e os traduz em notificações visuais.
 * Deve ser renderizado dentro de ambos SocketProvider e NotificationsProvider.
 */
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSocket } from './useSocket';
import { useNotifications } from './NotificationsContext';

export const SocketNotificationsBridge: React.FC = () => {
  const socket = useSocket();
  const location = useLocation();
  const { user } = useAuth();
  const { setRoomsActivity, setUnreadMessages, refreshFriendInvites } = useNotifications();

  useEffect(() => {
    if (!socket) return;
    const userId = user?.userId || localStorage.getItem('userId');
    if (userId) {
      socket.emit('join_user', { userId });
    }

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

    const onFriendInvitationChanged = () => {
      void refreshFriendInvites();
    };

    socket.on('room_state_updated', onRoomStateUpdated);
    socket.on('room_invited', onRoomInvited);
    socket.on('new_message', onNewMessage);
    socket.on('friend_invitation_received', onFriendInvitationChanged);
    socket.on('friend_invitation_sent', onFriendInvitationChanged);
    socket.on('friend_invitation_accepted', onFriendInvitationChanged);
    socket.on('friend_invitation_declined', onFriendInvitationChanged);
    socket.on('friend_invitation_cancelled', onFriendInvitationChanged);
    socket.on('friendship_removed', onFriendInvitationChanged);

    return () => {
      socket.off('room_state_updated', onRoomStateUpdated);
      socket.off('room_invited', onRoomInvited);
      socket.off('new_message', onNewMessage);
      socket.off('friend_invitation_received', onFriendInvitationChanged);
      socket.off('friend_invitation_sent', onFriendInvitationChanged);
      socket.off('friend_invitation_accepted', onFriendInvitationChanged);
      socket.off('friend_invitation_declined', onFriendInvitationChanged);
      socket.off('friend_invitation_cancelled', onFriendInvitationChanged);
      socket.off('friendship_removed', onFriendInvitationChanged);
    };
  }, [socket, location.pathname, refreshFriendInvites, setRoomsActivity, setUnreadMessages, user?.userId]);

  return null;
};
