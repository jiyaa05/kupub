// =============================================================================
// Order API
// =============================================================================

import { apiClient } from '@/shared/api';
import type { Order, OrderRequest } from '@/shared/types/api';

export async function createOrder(dept: string, data: OrderRequest) {
  return apiClient.post<Order>(`/api/${dept}/orders`, data);
}

