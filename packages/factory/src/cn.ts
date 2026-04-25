import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type { ClassValue };

/**
 * Combines class values using clsx (for conditional/array/object syntax)
 * and tailwind-merge (to resolve conflicting Tailwind utility classes).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
