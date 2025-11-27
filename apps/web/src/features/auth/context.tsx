// =============================================================================
// Auth Context - 관리자 인증
// =============================================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useLocalStorage } from '@/shared/hooks';
import { apiClient } from '@/shared/api';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface AuthUser {
  username: string;
  departmentId: number | null;
  departmentSlug: string | null;
  role: 'SUPER_ADMIN' | 'DEPT_ADMIN' | 'STAFF';
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginRequest {
  username: string;
  password: string;
  departmentSlug?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  departmentId: number | null;
  departmentSlug: string | null;
  role: 'SUPER_ADMIN' | 'DEPT_ADMIN' | 'STAFF';
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<boolean>;
  logout: () => void;
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [storedAuth, setStoredAuth, removeStoredAuth] = useLocalStorage<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  } | null>('kupub_admin_auth', null);

  const [isLoading, setIsLoading] = useState(true);

  // 초기화
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // 로그인
  const login = useCallback(
    async (data: LoginRequest): Promise<boolean> => {
      try {
        const response = await apiClient.post<LoginResponse>('/api/auth/login', data);

        if (response.error || !response.data) {
          console.error('Login failed:', response.error);
          return false;
        }

        const { accessToken, refreshToken, username, departmentId, departmentSlug, role } =
          response.data;

        setStoredAuth({
          user: { username, departmentId, departmentSlug, role },
          accessToken,
          refreshToken,
        });

        return true;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    [setStoredAuth]
  );

  // 로그아웃
  const logout = useCallback(() => {
    removeStoredAuth();
  }, [removeStoredAuth]);

  const value: AuthContextValue = {
    user: storedAuth?.user ?? null,
    accessToken: storedAuth?.accessToken ?? null,
    isAuthenticated: !!storedAuth?.accessToken,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

