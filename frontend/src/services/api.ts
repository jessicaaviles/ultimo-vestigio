const rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api';
export const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

export const listCases = async (userId?: string | null) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_URL}/cases${query}`);
  return res.json();
};

export const generateCaseImage = async (slug: string) => {
  const res = await fetch(`${API_URL}/cases/${encodeURIComponent(slug)}/generate-image`, { method: 'POST' });
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

export const authRegister = async (email: string, password: string, displayName?: string) => {
  const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, displayName }) });
  return res.json();
};

export const authLogin = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return res.json();
};

export const authLink = async (email: string, password: string, anonymousUserId: string) => {
  const res = await fetch(`${API_URL}/auth/link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, anonymousUserId }) });
  return res.json();
};

export const authValidate = async (token: string) => {
  const res = await fetch(`${API_URL}/auth/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  return res.json();
};

export const authLogout = async (token: string) => {
  const res = await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  return res.json();
};

export const authGoogle = async (credential: string, displayName?: string) => {
  const res = await fetch(`${API_URL}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential, displayName }) });
  return res.json();
};
