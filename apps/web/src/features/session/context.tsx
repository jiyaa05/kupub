// =============================================================================
// Session Context
// =============================================================================

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { useLocalStorage } from '@/shared/hooks';
import { STORAGE_KEYS } from '@/shared/utils';
import { useDepartment } from '@/features/department';
import type { Session, SessionStartRequest } from '@/shared/types/api';
import { startSession as startSessionApi, getSession as getSessionApi } from './api';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface SessionState {
  session: Session | null;
  isStarting: boolean;
  error: string | null;
}

interface SessionContextValue extends SessionState {
  startSession: (data: SessionStartRequest) => Promise<Session | null>;
  loadSession: (sessionId: number) => Promise<Session | null>;
  clearSession: () => void;
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const SessionContext = createContext<SessionContextValue | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { dept } = useDepartment();
  const [stored, setStored, removeStored] = useLocalStorage<Session | null>(
    `${STORAGE_KEYS.SESSION}_${dept}`,
    null
  );

  // 세션 시작
  const startSession = useCallback(
    async (data: SessionStartRequest): Promise<Session | null> => {
      const response = await startSessionApi(dept, data);
      if (response.error) {
        console.error('Session start error:', response.error);
        return null;
      }
      if (response.data) {
        setStored(response.data);
        return response.data;
      }
      return null;
    },
    [dept, setStored]
  );

  // 세션 로드
  const loadSession = useCallback(
    async (sessionId: number): Promise<Session | null> => {
      const response = await getSessionApi(dept, sessionId);
      if (response.error) {
        console.error('Session load error:', response.error);
        return null;
      }
      if (response.data) {
        setStored(response.data);
        return response.data;
      }
      return null;
    },
    [dept, setStored]
  );

  // 세션 클리어
  const clearSession = useCallback(() => {
    removeStored();
  }, [removeStored]);

  return (
    <SessionContext.Provider
      value={{
        session: stored,
        isStarting: false,
        error: null,
        startSession,
        loadSession,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

