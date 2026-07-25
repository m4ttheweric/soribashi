/**
 * Adapted from @mantine/core
 * Source: packages/@mantine/core/src/core/MantineProvider/color-functions/parse-theme-color/parse-theme-color.ts
 * Upstream: https://github.com/mantinedev/mantine (master @ 63dafbbf, 2026-04-25)
 * License: MIT — see THIRD-PARTY-LICENSES.md at repo root
 *
 * Soribashi changes:
 *   - Token names: --mantine-color-{family}-{shade} → --color-{family}-{shade}
 *   - Drops Mantine's parseThemeColor object-return; this returns the resolved CSS string directly
 *   - Recognizes soribashi semantic surface/text/border tokens (e.g., 'surface.raised')
 *   - Theme argument is optional (Mantine requires it); without it, dot-paths
 *     still resolve structurally but bare names always pass through.
 */
import type { ResolvedTheme } from '@soribashi/theme';

const COLOR_KEYWORDS = new Set(['transparent', 'inherit', 'currentColor', 'currentcolor']);

/**
 * Resolves a theme color reference to a CSS color value:
 *   - 'primary.500'         → var(--color-primary-500) (family checked against theme when given)
 *   - 'primary'             → var(--color-primary-500) only when 'primary' is in theme.tokens.colors
 *   - 'surface.raised'      → var(--surface-raised)
 *   - 'text.muted'          → var(--text-muted)
 *   - 'border.strong'       → var(--border-strong)
 *   - any other CSS value   → returned verbatim ('white', '#fff', 'rgb(…)', keywords)
 */
export function getThemeColor(
  value: string | undefined,
  theme?: ResolvedTheme,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (COLOR_KEYWORDS.has(value)) return value;

  // dot-path forms: family.shade or namespace.name
  if (value.includes('.')) {
    const [namespace, key] = value.split('.', 2);
    if (namespace === 'surface' || namespace === 'text' || namespace === 'border') {
      return `var(--${namespace}-${key})`;
    }
    // Without a theme the dot structure alone signals a color reference;
    // with one, only known families resolve (Mantine parity).
    if (theme === undefined || Object.hasOwn(theme.tokens.colors ?? {}, namespace!)) {
      return `var(--color-${namespace}-${key})`;
    }
    return value;
  }

  // bare name: resolve to the default 500 shade only when the theme declares
  // the family; otherwise it is a CSS color ('white', 'red', ...) — pass through
  if (theme !== undefined && Object.hasOwn(theme.tokens.colors ?? {}, value)) {
    return `var(--color-${value}-500)`;
  }

  return value;
}
