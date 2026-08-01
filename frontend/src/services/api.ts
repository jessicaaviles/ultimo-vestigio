const rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api';
export const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

const REQUEST_TIMEOUT_MS = 15000;

const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const method = init?.method?.toUpperCase() || 'GET';
  const target = typeof input === 'string' || input instanceof URL ? new URL(String(input), window.location.origin) : input;
  const requestInput = method === 'GET' && target instanceof URL
    ? (() => {
      target.searchParams.set('_t', String(Date.now()));
      return target.toString();
    })()
    : input;
  try {
    return await fetch(requestInput, { ...init, cache: 'no-store', signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

export const listCases = async (userId?: string | null) => {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('_t', String(Date.now()));
  const query = `?${params.toString()}`;
  const res = await apiFetch(`${API_URL}/cases${query}`, { cache: 'no-store' });
  return res.json();
};

export const generateCaseImage = async (slug: string) => {
  const res = await apiFetch(`${API_URL}/cases/${encodeURIComponent(slug)}/generate-image`, { method: 'POST' });
  return res.json();
};

export const registerAnonymousUser = async (displayName?: string) => {
  const res = await apiFetch(`${API_URL}/anonymous-users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName })
  });
  return res.json();
};

export const createRoom = async (caseId: string, hostUserId: string, hostDisplayName: string, settings?: { turn_timer_seconds: number | null }) => {
  const res = await apiFetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId, hostUserId, hostDisplayName, settings })
  });
  return res.json();
};

export const joinRoom = async (publicCode: string, userId: string, displayName: string) => {
  const res = await apiFetch(`${API_URL}/rooms/join`, {
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
  const res = await apiFetch(`${API_URL}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return res.json();
};

export const getProfile = async (userId: string) => {
  const res = await apiFetch(`${API_URL}/profiles/${encodeURIComponent(userId)}?_t=${Date.now()}`, { cache: 'no-store' });
  return res.json();
};

export const updateProfile = async (userId: string, payload: { displayName: string; bio: string; active: boolean; photoData?: string; generatePortrait: boolean }) => {
  const res = await apiFetch(`${API_URL}/profiles/${encodeURIComponent(userId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return res.json();
};

export const deleteProfile = async (userId: string, token: string) => {
  const res = await apiFetch(`${API_URL}/profiles/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const resetProfilePortraitGenerations = async (userId: string, token: string) => {
  const res = await apiFetch(`${API_URL}/profiles/${encodeURIComponent(userId)}/reset-portrait-generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const resetCaseProgress = async (userId: string, caseSlug: string, token: string) => {
  const res = await apiFetch(`${API_URL}/profiles/${encodeURIComponent(userId)}/cases/${encodeURIComponent(caseSlug)}/reset-progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const authRegister = async (email: string, password: string, displayName?: string) => {
  const res = await apiFetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, displayName }) });
  return res.json();
};

export const authLogin = async (email: string, password: string) => {
  const res = await apiFetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return res.json();
};

export const authLink = async (email: string, password: string, anonymousUserId: string) => {
  const res = await apiFetch(`${API_URL}/auth/link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, anonymousUserId }) });
  return res.json();
};

export const authValidate = async (token: string) => {
  const res = await apiFetch(`${API_URL}/auth/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  return res.json();
};

export const authLogout = async (token: string) => {
  const res = await apiFetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  return res.json();
};

export const authGoogle = async (credential: string, displayName?: string) => {
  const res = await apiFetch(`${API_URL}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential, displayName }) });
  return res.json();
};
