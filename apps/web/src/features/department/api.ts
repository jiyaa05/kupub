// =============================================================================
// Department API
// =============================================================================

import { apiClient } from '@/shared/api';
import type { DepartmentSettings } from '@/shared/types/api';

export async function fetchDepartmentSettings(dept: string) {
  return apiClient.get<DepartmentSettings>(`/api/${dept}/settings`);
}

