// =============================================================================
// API 클라이언트
// =============================================================================

import type { ApiResponse } from '@/shared/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const AUTH_STORAGE_KEY = 'kupub_admin_auth';

type StoredAdminAuth = {
  user: {
    username: string;
    departmentId: number;
    departmentSlug: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private resolveUrl(endpoint: string) {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    return `${this.baseUrl}${endpoint}`;
  }

  private getStoredAuth(): StoredAdminAuth | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredAdminAuth;
    } catch {
      return null;
    }
  }

  private saveStoredAuth(auth: StoredAdminAuth | null) {
    if (typeof window === 'undefined') return;
    if (!auth) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }

  private shouldSkipAuth(endpoint: string) {
    const url = this.resolveUrl(endpoint);
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      const parsed = new URL(url, base);
      return parsed.pathname.startsWith('/api/auth');
    } catch {
      return false;
    }
  }

  private async refreshAccessToken(auth: StoredAdminAuth | null): Promise<string | null> {
    if (!auth?.refreshToken) {
      this.saveStoredAuth(null);
      return null;
    }

    try {
      const response = await fetch(this.resolveUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });

      const text = await response.text();
      const payload = text ? (JSON.parse(text) as ApiResponse<{ accessToken: string }>) : null;
      const newToken = payload?.data?.accessToken;

      if (response.ok && newToken) {
        this.saveStoredAuth({ ...auth, accessToken: newToken });
        return newToken;
      }
    } catch (error) {
      console.error('Failed to refresh access token', error);
    }

    this.saveStoredAuth(null);
    return null;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}, retry = false): Promise<Response> {
    const url = this.resolveUrl(endpoint);
    const { headers: customHeaders, ...rest } = options;
    const headers = new Headers(customHeaders || {});

    const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;
    if (!headers.has('Content-Type') && !isFormData) {
      headers.set('Content-Type', 'application/json');
    }

    const auth = this.getStoredAuth();
    const shouldAttachAuth = !this.shouldSkipAuth(endpoint) && !!auth?.accessToken;

    if (shouldAttachAuth && auth?.accessToken) {
      headers.set('Authorization', `Bearer ${auth.accessToken}`);
    }

    const response = await fetch(url, { ...rest, headers });

    if (response.status === 401 && shouldAttachAuth && !retry) {
      const nextToken = await this.refreshAccessToken(auth);
      if (nextToken) {
        headers.set('Authorization', `Bearer ${nextToken}`);
        return this.fetchWithAuth(endpoint, { ...options, headers }, true);
      }
    }

    return response;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithAuth(endpoint, options);
      const text = await response.text();
      if (!text) {
        return {
          data: null,
          error: {
            code: 'EMPTY_RESPONSE',
            message: '서버 응답이 없습니다.',
          },
        };
      }
      return JSON.parse(text) as ApiResponse<T>;
    } catch (error) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
        },
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

