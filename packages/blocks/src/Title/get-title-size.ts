/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/components/Title/get-title-size.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Reads from soribashi heading vars: --heading-h{N}-{font-size,font-weight,line-height}
 *     (emitted by codegen from theme.tokens.heading.sizes; see emit-css.ts)
 *   - Font-size key path uses --font-size-{key} (no `--mantine-` prefix).
 *   - rem() helper imported from local utils.
 *   - Font-size keys resolve open-endedly (any token-looking key becomes
 *     var(--font-size-{key}), matching getSpacing/getRadius) instead of a
 *     closed xs..3xl allowlist. Digit-leading {n}xl keys are carved out of
 *     the raw-CSS heuristic since they are documented font-size tokens.
 */
import { rem } from '../utils/rem.ts';
import { isRawCss } from '../utils/get-size.ts';

export type TitleOrder = 1 | 2 | 3 | 4 | 5 | 6;
export type TitleSize = `h${TitleOrder}` | string | number;

export interface GetTitleSizeResult {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
}

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function isFontSizeToken(value: string): boolean {
  // '2xl'/'3xl' are digit-leading (raw CSS per the shared heuristic) but are
  // documented font-size tokens on Title, so they stay resolvable.
  return /^\d+xl$/.test(value) || !isRawCss(value);
}

export function getTitleSize(order: TitleOrder, size?: TitleSize): GetTitleSizeResult {
  const titleSize = size !== undefined ? size : `h${order}`;

  if (typeof titleSize === 'string' && HEADINGS.has(titleSize)) {
    return {
      fontSize: `var(--heading-${titleSize}-font-size)`,
      fontWeight: `var(--heading-${titleSize}-font-weight)`,
      lineHeight: `var(--heading-${titleSize}-line-height)`,
    };
  }

  if (typeof titleSize === 'string' && isFontSizeToken(titleSize)) {
    return {
      fontSize: `var(--font-size-${titleSize})`,
      fontWeight: `var(--heading-h${order}-font-weight)`,
      lineHeight: `var(--heading-h${order}-line-height)`,
    };
  }

  return {
    fontSize: rem(titleSize as string | number) ?? '',
    fontWeight: `var(--heading-h${order}-font-weight)`,
    lineHeight: `var(--heading-h${order}-line-height)`,
  };
}
