/**
 * TokenReview — every consolidated token rendered as a labeled swatch.
 * Used for visual confirmation that codegen → DOM is working end-to-end,
 * in both light and dark.
 *
 * Note on color expression: the soribashi codegen emits CSS vars whose
 * values already contain full `hsl(...)` color strings (see
 * `apps/core-radix-pilot/src/generated/theme.css`, e.g.
 * `--color-primary-500: hsl(221.2 83.2% 53.3%);`). So swatches reference
 * `var(--color-…)` directly — wrapping in another `hsl()` would expand to
 * `hsl(hsl(...))` and resolve to transparent. The plan's draft code wrapped
 * the var in `hsl()`; that is corrected here to match the pilot's actual
 * emit format.
 */
import { theme as _theme } from '../theme/index.ts';

// Touch the imported theme so type-only imports stay live and any future
// dynamic checks have something to anchor on. Removing this would not change
// rendering — the swatches read from CSS vars at runtime, not from `theme`.
void _theme;

const COLOR_FAMILIES = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

const SEMANTIC_TOKENS: ReadonlyArray<readonly [label: string, cssVar: string]> = [
  ['surface.canvas', '--surface-canvas'],
  ['surface.default', '--surface-default'],
  ['surface.raised', '--surface-raised'],
  ['surface.sunken', '--surface-sunken'],
  ['surface.overlay', '--surface-overlay'],
  ['text.default', '--text-default'],
  ['text.muted', '--text-muted'],
  ['text.subtle', '--text-subtle'],
  ['text.disabled', '--text-disabled'],
  ['border.default', '--border-default'],
  ['border.strong', '--border-strong'],
  ['border.muted', '--border-muted'],
];

export function TokenReview() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>Color scales</h2>
      {COLOR_FAMILIES.map((family) => (
        <div key={family} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', textTransform: 'capitalize' }}>{family}</h3>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {SHADES.map((shade) => {
              const cssVar = `--color-${family}-${shade}`;
              return (
                <div
                  key={shade}
                  style={{
                    width: '64px',
                    height: '64px',
                    background: `var(${cssVar})`,
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    fontSize: '10px',
                    color: '#000',
                    paddingBottom: '4px',
                  }}
                  title={cssVar}
                >
                  {shade}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <h2 style={{ fontFamily: 'var(--font-family-sans)', marginTop: '3rem' }}>Semantic tokens</h2>
      <table style={{ borderCollapse: 'collapse', fontFamily: 'var(--font-family-sans)' }}>
        <thead>
          <tr>
            <th align="left" style={{ paddingRight: '1rem' }}>Token</th>
            <th align="left" style={{ paddingRight: '1rem' }}>CSS var</th>
            <th align="left">Swatch</th>
          </tr>
        </thead>
        <tbody>
          {SEMANTIC_TOKENS.map(([name, cssVar]) => (
            <tr key={name}>
              <td style={{ paddingRight: '1rem' }}>{name}</td>
              <td style={{ paddingRight: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{cssVar}</td>
              <td>
                <div
                  style={{
                    width: '120px',
                    height: '32px',
                    background: `var(${cssVar})`,
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
