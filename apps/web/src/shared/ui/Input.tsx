// =============================================================================
// Input v2 - Clean & Friendly
// =============================================================================

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            `w-full h-14 px-4 rounded-xl
            bg-white
            border-2 border-neutral-200
            text-neutral-900 text-base
            placeholder:text-neutral-400
            transition-all duration-200
            focus:outline-none focus:border-theme-primary focus:ring-4
            hover:border-neutral-300
            disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed`,
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          style={{ '--tw-ring-color': 'rgba(var(--theme-primary-rgb), 0.1)' } as React.CSSProperties}
          {...props}
        />
        {(error || helper) && (
          <p className={cn('text-sm', error ? 'text-red-500' : 'text-neutral-500')}>
            {error || helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
