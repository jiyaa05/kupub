// =============================================================================
// App Providers - 전역 Context Provider 구성
// =============================================================================

import type { ReactNode } from 'react';
import { DepartmentProvider } from '@/features/department';
import { CartProvider } from '@/features/cart';
import { SessionProvider } from '@/features/session';

interface AppProvidersProps {
  dept: string;
  children: ReactNode;
}

/**
 * 학과별 Provider 래퍼
 * DepartmentProvider > SessionProvider > CartProvider 순서로 감싸야 함
 */
export function AppProviders({ dept, children }: AppProvidersProps) {
  return (
    <DepartmentProvider dept={dept}>
      <SessionProvider>
        <CartProvider>{children}</CartProvider>
      </SessionProvider>
    </DepartmentProvider>
  );
}

