/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/use-random-classname/use-random-classname.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Class prefix: 'mantine-...' → 'sb-...'
 */
import { useId } from 'react';

/**
 * Returns a stable-per-instance CSS-class-safe identifier.
 *
 * Uses React.useId() and strips colons (which aren't valid in class selectors).
 * The same component instance always gets the same name across re-renders;
 * different instances get different names. This is what powers per-instance
 * scoped style blocks for responsive style props.
 */
export function useRandomClassName(): string {
  const id = useId();
  return `sb-${id.replace(/:/g, '')}`;
}
