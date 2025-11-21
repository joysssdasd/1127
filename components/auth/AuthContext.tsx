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
  isAdmin: boolean;
  login: (payload: { user: UserProfile; tokens: StoredTokens; isAdmin: boolean }) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  tokens: null,
  loading: false,
  isAdmin: false,
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

const STORAGE_KEY = 'c2c-auth';

async function fetchProfile(token: string): Promise<{ user: UserProfile; isAdmin: boolean }> {
  const res = await fetch('/api/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('获取用户信息失败');
  }
  const data = await res.json();
  return { user: data.user, isAdmin: Boolean(data.isAdmin) };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as StoredTokens;
      setTokens(parsed);
      // 添加超时保护，防止 API 调用挂起
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), 5000); // 5秒超时
      });

      Promise.race([fetchProfile(parsed.accessToken), timeoutPromise])
        .then((result) => {
          setUser((result as { user: UserProfile; isAdmin: boolean }).user);
          setIsAdmin((result as { user: UserProfile; isAdmin: boolean }).isAdmin);
        })
        .catch((error) => {
          console.warn('获取用户信息失败:', error);
          window.localStorage.removeItem(STORAGE_KEY);
          setTokens(null);
          setIsAdmin(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = ({ user: profile, tokens: newTokens, isAdmin: adminFlag }: { user: UserProfile; tokens: StoredTokens; isAdmin: boolean }) => {
    setTokens(newTokens);
    setUser(profile);
    setIsAdmin(adminFlag);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens));
  };

  const logout = () => {
    setTokens(null);
    setUser(null);
    setIsAdmin(false);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const refreshProfile = async () => {
    if (!tokens) return;
    const result = await fetchProfile(tokens.accessToken);
    setUser(result.user);
    setIsAdmin(result.isAdmin);
  };

  const value: AuthContextValue = {
    user,
    tokens,
    loading,
    isAdmin,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
