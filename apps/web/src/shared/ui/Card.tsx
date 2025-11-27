// =============================================================================
// Card v2 - Clean & Elevated
// =============================================================================

import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
  hoverable = false,
}: CardProps) {
  const variants = {
    default: 'bg-white shadow-soft',
    outlined: 'bg-white border border-neutral-200',
    elevated: 'bg-white shadow-medium',
    filled: 'bg-neutral-50',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-200',
        variants[variant],
        paddings[padding],
        hoverable && 'hover:shadow-medium hover:-translate-y-0.5 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
