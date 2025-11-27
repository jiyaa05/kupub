// =============================================================================
// 클래스명 유틸리티
// =============================================================================

type ClassValue = string | number | boolean | null | undefined | string[] | Record<string, boolean>;

export function cn(...inputs: ClassValue[]): string {
  const result: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string' || typeof input === 'number') {
      result.push(String(input));
    } else if (Array.isArray(input)) {
      result.push(...input.filter(Boolean));
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) result.push(key);
      }
    }
  }
  
  return result.join(' ').trim();
}

