// =============================================================================
// Layout v2 - Consistent Page Structure
// =============================================================================

import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/shared/utils';

// -----------------------------------------------------------------------------
// PageLayout
// -----------------------------------------------------------------------------

export interface PageLayoutProps {
  children?: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'full';
  noPadding?: boolean;
  background?: 'gradient' | 'white' | 'gray' | 'theme';
}

export function PageLayout({
  children,
  className,
  header,
  footer,
  maxWidth = 'sm',
  noPadding = false,
  background = 'theme',
}: PageLayoutProps) {
  const maxWidths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'max-w-full',
  };

  const backgrounds = {
    gradient: 'bg-gradient-to-b from-white via-neutral-50/50 to-neutral-100/50',
    white: 'bg-white',
    gray: 'bg-neutral-50',
    theme: 'bg-theme-background',
  };

  return (
    <div className={cn('min-h-screen text-theme-text flex flex-col', backgrounds[background])}>
      {header}
      <main
        className={cn(
          'flex-1 w-full mx-auto',
          maxWidths[maxWidth],
          !noPadding && 'px-5 py-6',
          className
        )}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}

// -----------------------------------------------------------------------------
// PublicLayout
// -----------------------------------------------------------------------------

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-theme-background text-theme-text">
      <Outlet />
    </div>
  );
}

// -----------------------------------------------------------------------------
// FullPageSpinner
// -----------------------------------------------------------------------------

export function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-theme-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div 
          className="w-12 h-12 border-4 rounded-full animate-spin" 
          style={{
            borderColor: 'rgba(var(--theme-primary-rgb), 0.2)',
            borderTopColor: 'var(--theme-primary)',
          }}
        />
        <p className="text-neutral-500 text-sm">로딩 중...</p>
      </div>
    </div>
  );
}
