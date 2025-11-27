// =============================================================================
// SelectChip v2 - Pill-style Selection
// =============================================================================

import { cn } from '@/shared/utils';

export interface SelectChipProps {
  children: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SelectChip({
  children,
  selected = false,
  disabled = false,
  onClick,
  className,
}: SelectChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-11 px-4 rounded-xl text-sm font-medium transition-all duration-200 ease-out border-2',
        !selected && !disabled && 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50',
        selected && 'bg-theme-primary border-theme-primary text-white',
        disabled && 'bg-neutral-100 border-neutral-100 text-neutral-400 cursor-not-allowed line-through',
        className
      )}
    >
      {children}
    </button>
  );
}
