// =============================================================================
// Reservation API
// =============================================================================

import { apiClient } from '@/shared/api';
import type { Reservation, ReservationRequest } from '@/shared/types/api';

export async function createReservation(dept: string, data: ReservationRequest) {
  return apiClient.post<Reservation>(`/api/${dept}/reservations`, data);
}

