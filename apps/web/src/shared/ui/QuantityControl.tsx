// =============================================================================
// QuantityControl v2 - Clean Counter
// =============================================================================

import { cn } from '@/shared/utils';

export interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
  onRemove?: () => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityControl({
  value,
  onChange,
  onRemove,
  min = 1,
  max = 99,
  className,
}: QuantityControlProps) {
  const handleDecrease = () => {
    if (value <= min && onRemove) {
      onRemove();
    } else if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const showTrash = value <= min && onRemove;

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {/* Decrease / Trash */}
      <button
        type="button"
        onClick={handleDecrease}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
          showTrash 
            ? 'bg-red-50 text-red-500 hover:bg-red-100' 
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        )}
        aria-label={showTrash ? '삭제' : '감소'}
      >
        {showTrash ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        )}
      </button>

      {/* Value */}
      <span className="w-10 text-center text-base font-semibold text-neutral-900">
        {value}
      </span>

      {/* Increase */}
      <button
        type="button"
        onClick={handleIncrease}
        className="w-9 h-9 rounded-xl bg-theme-primary text-white flex items-center justify-center hover:bg-theme-primary-hover transition-colors"
        aria-label="증가"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
