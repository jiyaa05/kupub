// =============================================================================
// Menu API
// =============================================================================

import { apiClient } from '@/shared/api';
import type { MenuResponse } from '@/shared/types/api';

export async function fetchMenus(dept: string) {
  return apiClient.get<MenuResponse>(`/api/${dept}/menus`);
}

