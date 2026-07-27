export interface ProgressStats {
  hostedRoomsCount: number;
  playedRoomsCount: number;
  theoriesCount: number;
  correctTheoriesCount: number;
}

export const emptyProgressStats: ProgressStats = {
  hostedRoomsCount: 0,
  playedRoomsCount: 0,
  theoriesCount: 0,
  correctTheoriesCount: 0,
};

export const markAllProgressReset = (userId: string) => {
  localStorage.setItem('progressResetUserId', userId);
  localStorage.setItem('progressResetAllAt', String(Date.now()));
  localStorage.setItem('solvedCases', JSON.stringify([]));
  localStorage.removeItem('currentRoomId');
  localStorage.removeItem('currentRoomCode');
};

export const hasAllProgressReset = (userId?: string | null) => {
  if (!userId) return false;
  return localStorage.getItem('progressResetUserId') === userId && Boolean(localStorage.getItem('progressResetAllAt'));
};

export const clearAllProgressReset = (userId?: string | null) => {
  if (userId && localStorage.getItem('progressResetUserId') !== userId) return;
  localStorage.removeItem('progressResetUserId');
  localStorage.removeItem('progressResetAllAt');
};

export const applyProgressReset = <T extends { stats?: ProgressStats | null }>(profile: T, userId?: string | null): T => {
  if (!hasAllProgressReset(userId)) return profile;
  const stats = profile.stats;
  const hasProgress = Boolean(stats && (
    Number(stats.hostedRoomsCount) > 0 ||
    Number(stats.playedRoomsCount) > 0 ||
    Number(stats.theoriesCount) > 0 ||
    Number(stats.correctTheoriesCount) > 0
  ));
  if (hasProgress) {
    clearAllProgressReset(userId);
    return profile;
  }
  return { ...profile, stats: emptyProgressStats };
};
