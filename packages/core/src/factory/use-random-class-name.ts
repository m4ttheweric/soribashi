/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/Box/use-random-classname/use-random-classname.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Class prefix: 'mantine-...' → 'sb-...'
 *   - Regex extended to strip «» guillemet markers emitted by React 19 useId()
 *   - Strip logic extracted to `stripIdMarkers` for unit-testability
 */
import { useId } from 'react';

/**
 * Removes characters that are invalid in CSS class selectors from a React
 * `useId()` output.
 *
 * React 18 wraps ids with colons (`':r0:'`).
 * React 19 also wraps ids with guillemet pairs (`'«»'`).
 * Both must be stripped before the string is used as a class name.
 */
export function stripIdMarkers(id: string): string {
  return id.replace(/[:«»]/g, '');
}

/**
 * Returns a stable-per-instance CSS-class-safe identifier.
 *
 * Uses React.useId() and strips colons and guillemet markers (which aren't
 * valid in class selectors). The same component instance always gets the same
 * name across re-renders; different instances get different names. This is
 * what powers per-instance scoped style blocks for responsive style props.
 */
export function useRandomClassName(): string {
  const id = useId();
  return `sb-${stripIdMarkers(id)}`;
}
