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
 */

/**
 * Resolves a theme color reference to a CSS color value:
 *   - 'primary.500'         → var(--color-primary-500)
 *   - 'primary'             → var(--color-primary-500) (default shade)
 *   - 'surface.raised'      → var(--surface-raised)
 *   - 'text.muted'          → var(--text-muted)
 *   - 'border.strong'       → var(--border-strong)
 *   - any other CSS value   → returned verbatim
 */
export function getThemeColor(value: string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;

  // dot-path forms: family.shade or namespace.name
  if (value.includes('.')) {
    const [namespace, key] = value.split('.', 2);
    if (namespace === 'surface' || namespace === 'text' || namespace === 'border') {
      return `var(--${namespace}-${key})`;
    }
    // assume color family.shade
    return `var(--color-${namespace}-${key})`;
  }

  // bare name: assume color family with default 500 shade
  // (heuristic: lower-case, alphabetic-only names probably target color scales)
  if (/^[a-z][a-z-]*$/.test(value)) {
    // could be a CSS keyword like 'red', 'transparent', 'inherit', etc.
    // We can't reliably tell — prefer literal pass-through for short generic words.
    if (value === 'transparent' || value === 'inherit' || value === 'currentColor') {
      return value;
    }
    return `var(--color-${value}-500)`;
  }

  // anything else (rgb, hsl, hex, var, etc.) passes through
  return value;
}
