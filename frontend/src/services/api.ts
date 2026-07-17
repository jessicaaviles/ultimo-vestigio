const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

export const listCases = async () => {
  const res = await fetch(`${API_URL}/cases`);
  return res.json();
};

export const registerAnonymousUser = async (displayName?: string) => {
  const res = await fetch(`${API_URL}/anonymous-users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName })
  });
  return res.json();
};

export const createRoom = async (caseId: string, hostUserId: string, hostDisplayName: string, settings?: { turn_timer_seconds: number | null }) => {
  const res = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId, hostUserId, hostDisplayName, settings })
  });
  return res.json();
};

export const joinRoom = async (publicCode: string, userId: string, displayName: string) => {
  const res = await fetch(`${API_URL}/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicCode, userId, displayName })
  });
  return res.json();
};

export const submitFeedback = async (payload: {
  roomId: string; userId: string; rating: number; fairSolution: boolean; masterError: boolean;
  confusion: boolean; playAnother: boolean; recommendationScore: number; bestMoment?: string;
  worstMoment?: string; hardestPart?: string;
}) => {
  const res = await fetch(`${API_URL}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return res.json();
};

export const getProfile = async (userId: string) => {
  const res = await fetch(`${API_URL}/profiles/${encodeURIComponent(userId)}`);
  return res.json();
};

export const updateProfile = async (userId: string, payload: { displayName: string; bio: string; active: boolean; photoData?: string; generatePortrait: boolean }) => {
  const res = await fetch(`${API_URL}/profiles/${encodeURIComponent(userId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return res.json();
};
