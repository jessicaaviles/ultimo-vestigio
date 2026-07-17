import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface NotificationsState {
  messages: number;   // count of unread messages
  rooms: boolean;     // has new available room activity
}

interface NotificationsContextValue {
  notifications: NotificationsState;
  /** Incrementa ou define a contagem de mensagens não lidas */
  setUnreadMessages: (count: number) => void;
  /** Sinaliza que há atividade nova em salas */
  setRoomsActivity: (hasActivity: boolean) => void;
  /** Zera mensagens (chamado ao entrar na tela de messages) */
  clearMessages: () => void;
  /** Zera rooms (chamado ao entrar na tela de lobby) */
  clearRooms: () => void;
  /** Retorna true se qualquer notificação estiver ativa */
  hasAny: boolean;
}

const STORAGE_KEY = 'uv_notifications';

const defaultState: NotificationsState = { messages: 0, rooms: false };

const NotificationsCtx = createContext<NotificationsContextValue>({
  notifications: defaultState,
  setUnreadMessages: () => {},
  setRoomsActivity: () => {},
  clearMessages: () => {},
  clearRooms: () => {},
  hasAny: false,
});

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const setUnreadMessages = useCallback((count: number) => {
    setNotifications(prev => ({ ...prev, messages: Math.max(0, count) }));
  }, []);

  const setRoomsActivity = useCallback((hasActivity: boolean) => {
    setNotifications(prev => ({ ...prev, rooms: hasActivity }));
  }, []);

  const clearMessages = useCallback(() => {
    setNotifications(prev => ({ ...prev, messages: 0 }));
  }, []);

  const clearRooms = useCallback(() => {
    setNotifications(prev => ({ ...prev, rooms: false }));
  }, []);

  const hasAny = notifications.messages > 0 || notifications.rooms;

  return (
    <NotificationsCtx.Provider value={{
      notifications,
      setUnreadMessages,
      setRoomsActivity,
      clearMessages,
      clearRooms,
      hasAny,
    }}>
      {children}
    </NotificationsCtx.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsCtx);
