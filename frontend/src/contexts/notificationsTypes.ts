export interface NotificationsState {
  messages: number;
  rooms: boolean;
  friendInvites: number;
}

export interface NotificationsContextValue {
  notifications: NotificationsState;
  setUnreadMessages: (count: number) => void;
  setRoomsActivity: (hasActivity: boolean) => void;
  setFriendInvites: (count: number) => void;
  clearMessages: () => void;
  clearRooms: () => void;
  clearFriendInvites: () => void;
  refreshFriendInvites: () => Promise<void>;
  hasAny: boolean;
}
