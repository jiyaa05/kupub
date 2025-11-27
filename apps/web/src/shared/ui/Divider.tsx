// =============================================================================
// Divider v2
// =============================================================================

import { cn } from '@/shared/utils';

export interface DividerProps {
  className?: string;
  label?: string;
}

export function Divider({ className, label }: DividerProps) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-sm text-neutral-400">{label}</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>
    );
  }

  return <div className={cn('w-full h-px bg-neutral-200', className)} />;
}
