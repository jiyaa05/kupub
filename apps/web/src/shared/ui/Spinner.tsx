// =============================================================================
// Spinner v2
// =============================================================================

import { cn } from '@/shared/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizes[size],
        className
      )}
      style={{
        borderColor: 'rgba(var(--theme-primary-rgb), 0.2)',
        borderTopColor: 'var(--theme-primary)',
      }}
    />
  );
}
