// =============================================================================
// Menu Hooks
// =============================================================================

import { useState, useEffect } from 'react';
import type { MenuResponse } from '@/shared/types/api';
import { useDepartment } from '@/features/department';
import { fetchMenus } from './api';

export function useMenus() {
  const { dept } = useDepartment();
  const [data, setData] = useState<MenuResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetchMenus(dept);

    if (response.error) {
      setError(response.error.message);
      setData(null);
    } else {
      setData(response.data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetch();
  }, [dept]);

  return { data, isLoading, error, refetch: fetch };
}

