/**
 * Soribashi addition (no direct Mantine counterpart — Mantine resolves fw as
 * identity). Aligns `fw` with its token-backed siblings (getFontSize,
 * getSpacing, getLineHeight): open-ended token resolution via the shared
 * isRawCss heuristic. Numbers stay unitless (font-weight is unitless), so
 * getSize is not reused — same posture as getLineHeight.
 */
import { isRawCss } from './get-size.ts';

/**
 * Relative and normal font-weight keywords: valid CSS values that are not
 * plausible token keys (fw="bolder" is not var(--font-weight-bolder)).
 * `bold` is deliberately absent — it IS a theme token key (fontWeight.bold),
 * so it resolves to var(--font-weight-bold) like any other token.
 */
const FONT_WEIGHT_KEYWORDS = new Set(['normal', 'bolder', 'lighter']);

/**
 * Resolves a font-weight value to a CSS string:
 *   - number → unitless string (600 → '600')
 *   - token key ('bold', 'semibold', 'custom-key') → var(--font-weight-{key})
 *   - raw CSS value ('700', 'bolder', 'inherit', 'var(…)') → pass-through
 *   - undefined → undefined
 */
export function getFontWeight(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value.toString();
  if (FONT_WEIGHT_KEYWORDS.has(value)) return value;
  if (isRawCss(value)) return value;
  return `var(--font-weight-${value})`;
}
