// =============================================================================
// Button v2 - Modern & Polished with Theme Support
// =============================================================================

import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { cn } from '@/shared/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
      primary: 'btn-theme-primary text-white shadow-lg',
      secondary: 'btn-theme-secondary border-2 border-theme-secondary shadow-sm',
      ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200',
      outline: 'bg-transparent border-2 border-theme-primary text-theme-primary hover:bg-theme-primary-light active:bg-theme-primary-lighter',
    };

    const sizes = {
      sm: 'h-11 px-4 text-sm',
      md: 'h-13 px-6 text-base',
      lg: 'h-16 px-8 text-lg',
    };

    // Focus ring color uses CSS variable
    const focusStyle: CSSProperties = {
      '--tw-ring-color': 'var(--theme-primary)',
      ...style,
    } as CSSProperties;

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        style={focusStyle}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>잠시만요...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
