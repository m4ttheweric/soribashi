// Neutral scale shades emitted by @soribashi/ui's theme (packages/theme's
// defaultTokens). Hardcoded rather than read off the theme object because
// this page only renders CSS custom properties; the shade list mirrors
// packages/theme/src/tokens/default-tokens.ts's `colors.neutral` keys.
const NEUTRAL_SHADES = [
  '0',
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
];

// Semantic surface names emitted as --surface-* (packages/theme's
// DEFAULT_SURFACE in create-theme.ts).
const SURFACES = ['canvas', 'default', 'raised', 'sunken', 'overlay', 'placeholder'];

export function Tokens() {
  return (
    <div>
      <h1>Tokens</h1>
      <p>A read-only look at the tokens uiTheme emits as CSS custom properties.</p>

      <h2>Neutral scale</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {NEUTRAL_SHADES.map((shade) => (
          <div key={shade} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: `var(--color-neutral-${shade})`,
              }}
            />
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{shade}</div>
          </div>
        ))}
      </div>

      <h2>Surfaces</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {SURFACES.map((key) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: `var(--surface-${key})`,
              }}
            />
            <span style={{ fontSize: '0.875rem' }}>{`--surface-${key}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
