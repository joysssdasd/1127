import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserProfile } from '../../backend/shared/domain/user';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextValue {
  user: UserProfile | null;
  tokens: StoredTokens | null;
  loading: boolean;
  login: (payload: { user: UserProfile; tokens: StoredTokens }) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  tokens: null,
  loading: false,
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

const STORAGE_KEY = 'c2c-auth';

async function fetchProfile(token: string): Promise<UserProfile> {
  const res = await fetch('/api/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('获取用户信息失败');
  }
  const data = await res.json();
  return data.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as StoredTokens;
      setTokens(parsed);
      fetchProfile(parsed.accessToken)
        .then(setUser)
        .catch(() => {
          window.localStorage.removeItem(STORAGE_KEY);
          setTokens(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = ({ user: profile, tokens: newTokens }: { user: UserProfile; tokens: StoredTokens }) => {
    setTokens(newTokens);
    setUser(profile);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens));
  };

  const logout = () => {
    setTokens(null);
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const refreshProfile = async () => {
    if (!tokens) return;
    const profile = await fetchProfile(tokens.accessToken);
    setUser(profile);
  };

  const value: AuthContextValue = {
    user,
    tokens,
    loading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
