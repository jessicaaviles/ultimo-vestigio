import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { listFriendInvitations } from '../services/api';

export interface NotificationsState {
  messages: number;   // count of unread messages
  rooms: boolean;     // has new available room activity
  friendInvites: number; // count of pending friend invites
}

interface NotificationsContextValue {
  notifications: NotificationsState;
  /** Incrementa ou define a contagem de mensagens não lidas */
  setUnreadMessages: (count: number) => void;
  /** Sinaliza que há atividade nova em salas */
  setRoomsActivity: (hasActivity: boolean) => void;
  /** Atualiza a contagem de convites de amizade */
  setFriendInvites: (count: number) => void;
  /** Zera mensagens (chamado ao entrar na tela de messages) */
  clearMessages: () => void;
  /** Zera rooms (chamado ao entrar na tela de lobby) */
  clearRooms: () => void;
  /** Zera convites de amizade (chamado ao entrar na tela de amigos) */
  clearFriendInvites: () => void;
  /** Retorna true se qualquer notificação estiver ativa */
  hasAny: boolean;
}

const STORAGE_KEY = 'uv_notifications';

const defaultState: NotificationsState = { messages: 0, rooms: false, friendInvites: 0 };

const NotificationsCtx = createContext<NotificationsContextValue>({
  notifications: defaultState,
  setUnreadMessages: () => {},
  setRoomsActivity: () => {},
  setFriendInvites: () => {},
  clearMessages: () => {},
  clearRooms: () => {},
  clearFriendInvites: () => {},
  hasAny: false,
});

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<NotificationsState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;
    } catch {
      return defaultState;
    }
  });

  // Persiste sempre que muda
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch { /* ignore */ }
  }, [notifications]);

  useEffect(() => {
    if (!settings.push) {
      setNotifications(defaultState);
      return;
    }
    if (!settings.invites) {
      setNotifications(prev => ({ ...prev, rooms: false, friendInvites: 0 }));
    }
  }, [settings.invites, settings.push]);

  const setUnreadMessages = useCallback((count: number) => {
    if (!settings.push) return;
    setNotifications(prev => ({ ...prev, messages: Math.max(0, count) }));
  }, [settings.push]);

  const setRoomsActivity = useCallback((hasActivity: boolean) => {
    if (hasActivity && (!settings.push || !settings.invites)) return;
    setNotifications(prev => ({ ...prev, rooms: hasActivity }));
  }, [settings.invites, settings.push]);

  const setFriendInvites = useCallback((count: number) => {
    if (!settings.push || !settings.invites) return;
    setNotifications(prev => ({ ...prev, friendInvites: Math.max(0, count) }));
  }, [settings.invites, settings.push]);

  const clearMessages = useCallback(() => {
    setNotifications(prev => ({ ...prev, messages: 0 }));
  }, []);

  const clearRooms = useCallback(() => {
    setNotifications(prev => ({ ...prev, rooms: false }));
  }, []);

  const clearFriendInvites = useCallback(() => {
    setNotifications(prev => ({ ...prev, friendInvites: 0 }));
  }, []);

  useEffect(() => {
    if (!settings.push || !settings.invites) return;
    const userId = user?.userId || localStorage.getItem('userId');
    if (!userId) {
      setNotifications(prev => ({ ...prev, friendInvites: 0 }));
      return;
    }

    let active = true;
    const refreshFriendInvites = async () => {
      try {
        const response = await listFriendInvitations(userId);
        if (!active) return;
        if (response.success) {
          setNotifications(prev => ({ ...prev, friendInvites: (response.data?.invitations || []).length }));
        }
      } catch {
        if (active) setNotifications(prev => ({ ...prev, friendInvites: prev.friendInvites }));
      }
    };

    refreshFriendInvites();
    const interval = window.setInterval(refreshFriendInvites, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [settings.invites, settings.push, user?.userId]);

  const hasAny = notifications.messages > 0 || notifications.rooms || notifications.friendInvites > 0;

  return (
    <NotificationsCtx.Provider value={{
      notifications,
      setUnreadMessages,
      setRoomsActivity,
      setFriendInvites,
      clearMessages,
      clearRooms,
      clearFriendInvites,
      hasAny,
    }}>
      {children}
    </NotificationsCtx.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsCtx);
