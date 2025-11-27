// =============================================================================
// 클래스명 유틸리티
// =============================================================================

type ClassValue = string | number | boolean | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity)
    .filter((x): x is string | number => typeof x === 'string' || typeof x === 'number')
    .map(String)
    .join(' ')
    .trim();
}

