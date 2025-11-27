// =============================================================================
// Header v2 - Clean Navigation
// =============================================================================

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/utils';

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  className?: string;
  transparent?: boolean;
}

export function Header({
  title,
  showBack = false,
  backTo,
  onBack,
  rightAction,
  className,
  transparent = false,
}: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-16 flex items-center justify-between px-5',
        transparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur-xl border-b border-neutral-100',
        className
      )}
    >
      {/* Left */}
      <div className="w-12 flex items-center">
        {showBack && (
          <button
            onClick={handleBack}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="뒤로가기"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Center */}
      {title && (
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-neutral-900">
          {title}
        </h1>
      )}

      {/* Right */}
      <div className="w-12 flex items-center justify-end">
        {rightAction}
      </div>
    </header>
  );
}
