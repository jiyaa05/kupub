// =============================================================================
// Session API
// =============================================================================

import { apiClient } from '@/shared/api';
import type { Session, SessionStartRequest } from '@/shared/types/api';

export async function startSession(dept: string, data: SessionStartRequest) {
  return apiClient.post<Session>(`/api/${dept}/sessions/start`, data);
}

export async function getSession(dept: string, sessionId: number) {
  return apiClient.get<Session>(`/api/${dept}/sessions/${sessionId}`);
}

export async function getSessionByCode(dept: string, code: string) {
  return apiClient.get<Session>(`/api/${dept}/sessions/code/${code}`);
}

