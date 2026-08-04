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
  const { setRoomsActivity, refreshFriendInvites } = useNotifications();

  const shouldSurfaceRoomActivity = () => {
    const path = location.pathname;
    return !(path === '/lobby' || path === '/messages' || path.startsWith('/room/'));
  };

  const markRoomActivity = () => {
    if (shouldSurfaceRoomActivity()) {
      setRoomsActivity(true);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const userId = user?.userId || localStorage.getItem('userId');
    if (userId) {
      socket.emit('join_user', { userId });
    }

    // Eventos reais de jogo que representam novidade para quem está fora do fluxo ativo
    const onGameStarted = () => markRoomActivity();
    const onVoteStarted = () => markRoomActivity();
    const onVoteClosed = () => markRoomActivity();
    const onVoteTied = () => markRoomActivity();
    const onQuestionProcessed = () => markRoomActivity();
    const onQuestionNeedsReformulation = () => markRoomActivity();
    const onQuestionRepeated = () => markRoomActivity();
    const onClueUnlocked = () => markRoomActivity();
    const onLocationUnlocked = () => markRoomActivity();
    const onTheoriesRevealed = () => markRoomActivity();
    const onRoomPaused = () => markRoomActivity();
    const onRoomResumed = () => markRoomActivity();

    const onFriendInvitationChanged = () => {
      void refreshFriendInvites();
    };

    socket.on('game_started', onGameStarted);
    socket.on('vote_started', onVoteStarted);
    socket.on('vote_closed', onVoteClosed);
    socket.on('vote_tied', onVoteTied);
    socket.on('question_processed', onQuestionProcessed);
    socket.on('question_needs_reformulation', onQuestionNeedsReformulation);
    socket.on('question_repeated', onQuestionRepeated);
    socket.on('clue_unlocked', onClueUnlocked);
    socket.on('location_unlocked', onLocationUnlocked);
    socket.on('theories_revealed', onTheoriesRevealed);
    socket.on('room_paused', onRoomPaused);
    socket.on('room_resumed', onRoomResumed);
    socket.on('friend_invitation_received', onFriendInvitationChanged);
    socket.on('friend_invitation_sent', onFriendInvitationChanged);
    socket.on('friend_invitation_accepted', onFriendInvitationChanged);
    socket.on('friend_invitation_declined', onFriendInvitationChanged);
    socket.on('friend_invitation_cancelled', onFriendInvitationChanged);
    socket.on('friendship_removed', onFriendInvitationChanged);

    return () => {
      socket.off('game_started', onGameStarted);
      socket.off('vote_started', onVoteStarted);
      socket.off('vote_closed', onVoteClosed);
      socket.off('vote_tied', onVoteTied);
      socket.off('question_processed', onQuestionProcessed);
      socket.off('question_needs_reformulation', onQuestionNeedsReformulation);
      socket.off('question_repeated', onQuestionRepeated);
      socket.off('clue_unlocked', onClueUnlocked);
      socket.off('location_unlocked', onLocationUnlocked);
      socket.off('theories_revealed', onTheoriesRevealed);
      socket.off('room_paused', onRoomPaused);
      socket.off('room_resumed', onRoomResumed);
      socket.off('friend_invitation_received', onFriendInvitationChanged);
      socket.off('friend_invitation_sent', onFriendInvitationChanged);
      socket.off('friend_invitation_accepted', onFriendInvitationChanged);
      socket.off('friend_invitation_declined', onFriendInvitationChanged);
      socket.off('friend_invitation_cancelled', onFriendInvitationChanged);
      socket.off('friendship_removed', onFriendInvitationChanged);
    };
  }, [socket, location.pathname, refreshFriendInvites, setRoomsActivity, user?.userId]);

  return null;
};
