import { clsx, type ClassValue } from 'clsx';

export type { ClassValue };

type ClassNameMergeFn = (classes: string) => string;

let mergeFn: ClassNameMergeFn | null = null;

/**
 * Installs a post-processing step applied to `cn`'s clsx output. Pass
 * `tailwind-merge`'s `twMerge` to opt into Tailwind conflict resolution:
 *
 *   import { twMerge } from 'tailwind-merge';
 *   configureClassNameMerge(twMerge);
 *
 * Pass `null` to restore the clsx-only default. Module-level and
 * single-tenant, like the vocabulary registry.
 */
export function configureClassNameMerge(fn: ClassNameMergeFn | null): void {
  mergeFn = fn;
}

/**
 * Combines class values using clsx (conditional/array/object syntax).
 *
 * Conflict resolution is intentionally NOT applied by default: tailwind-merge
 * drops classes that look like Tailwind utilities (`flex`, `hidden`, `block`)
 * even when the consumer's CSS is not Tailwind. Opt in per app via
 * `configureClassNameMerge(twMerge)`.
 */
export function cn(...inputs: ClassValue[]): string {
  const combined = clsx(inputs);
  return mergeFn ? mergeFn(combined) : combined;
}
