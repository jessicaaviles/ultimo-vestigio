export interface AuthUser {
  userId: string;
  displayName: string;
  email: string | null;
  hasProfile: boolean;
  onboardingCompleted: boolean;
  photo: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
}
