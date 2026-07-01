/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/utils/get-line-height/get-line-height.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Replaced the closed xs..xl allowlist with the shared isRawCss heuristic
 *     (open-ended token resolution, matching getSpacing/getRadius). Numbers
 *     stay unitless rather than rem-converting, so getSize is not reused.
 */
import { isRawCss } from './get-size.ts';

/**
 * Resolves a line-height value to a CSS string:
 *   - number → unitless string (line-height multipliers)
 *   - token key ('md', 'custom-key') → var(--line-height-{key})
 *   - raw CSS value ('1.5', 'normal', 'calc(…)') → pass-through
 *   - undefined → undefined
 */
export function getLineHeight(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value.toString();
  // line-height: normal is valid CSS; 'normal' is not a plausible token key
  if (value === 'normal') return value;
  if (isRawCss(value)) return value;
  return `var(--line-height-${value})`;
}
