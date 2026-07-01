/**
 * Extracts bare HSL components from an `hsl(...)` wrapped color string.
 *   'hsl(221.2 83.2% 53.3%)'        → '221.2 83.2% 53.3%'
 *   'hsl(221.2, 83.2%, 53.3%)'      → '221.2, 83.2%, 53.3%'  (legacy syntax)
 *   'hsl(221 83% 53% / 0.5)'        → '221 83% 53% / 0.5'
 *
 * Returns `null` for non-hsl values (rgb, hex, named colors, var(), currentColor, etc.)
 * — those values can't usefully participate in Tailwind's <alpha-value> pattern.
 *
 * The `--__hsl-color-X-Y` companion var lets consumers use
 * `hsl(var(--__hsl-color-X-Y) / 0.5)` for translucency and lets Tailwind's
 * alpha-value utility classes work via `hsl(var(--__hsl-color-X-Y) / <alpha-value>)`.
 * The canonical wrapped var (`--color-X-Y`) remains the default for direct
 * CSS consumption. The `--__hsl-` prefix (rather than a `-hsl` suffix) keeps
 * the companions out of the `--color-` autocomplete namespace.
 */
export function stripHslWrapper(value: string): string | null {
  const match = value.match(/^hsl\((.*)\)$/i);
  return match && match[1] !== undefined ? match[1].trim() : null;
}
