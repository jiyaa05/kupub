// =============================================================================
// LocalStorage 유틸리티
// =============================================================================

export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error(`Failed to save ${key} to localStorage`);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      console.error(`Failed to remove ${key} from localStorage`);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      console.error('Failed to clear localStorage');
    }
  },
};

// 키 상수
export const STORAGE_KEYS = {
  CART: 'kupub_cart',
  SESSION: 'kupub_session',
  ONBOARDING_SEEN: 'kupub_onboarding_seen',
} as const;

