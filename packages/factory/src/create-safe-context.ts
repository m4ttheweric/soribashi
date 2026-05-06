/**
 * Vendored from Mantine v7 — see
 * @mantine/core/src/core/utils/create-safe-context/create-safe-context.tsx
 *
 * Internal use by `defineCompound`; not exported from `@soribashi/core`'s
 * public API in Wave 2 (see spec § 3.6 + OQ-6 — promotion to public is
 * backward-compatible when first concrete need appears).
 *
 * NOTE: Original Mantine uses React 19's `use` hook. We adapt to `useContext`
 * for React 18 compatibility.
 */
import { createContext, useContext } from 'react';

export function createSafeContext<ContextValue>(errorMessage: string) {
  const Context = createContext<ContextValue | null>(null);

  const useSafeContext = () => {
    const ctx = useContext(Context);
    if (ctx === null) {
      throw new Error(errorMessage);
    }
    return ctx;
  };

  return [Context, useSafeContext] as const;
}
