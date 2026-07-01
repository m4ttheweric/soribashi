/**
 * ButtonMatrix — full variant × intent × size × state matrix for the
 * Button recipe, in light + dark, with consolidation notes per cell.
 */
import { useState } from 'react';
import { Button } from '../recipes/Button/Button.tsx';

const VARIANTS = ['filled', 'outline', 'subtle', 'ghost', 'link'] as const;
const INTENTS = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export function ButtonMatrix() {
  // Toggle to verify the loading-state animation visually — flips three
  // demonstrator buttons (filled / outline / ghost) so the slide+veil+spinner
  // transition can be observed in/out across variants.
  const [demoLoading, setDemoLoading] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>Loading transition demo</h2>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-raised)',
        }}
      >
        <button
          type="button"
          onClick={() => setDemoLoading((v) => !v)}
          style={{
            padding: '0.5rem 1rem',
            fontFamily: 'var(--font-family-sans)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-default)',
            color: 'var(--text-default)',
          }}
        >
          {demoLoading ? 'Stop loading' : 'Start loading'}
        </button>
        <span style={{ fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
          Toggles the buttons below so you can watch the slide-out + veil + spinner-in animation.
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        <Button intent="primary" variant="filled" loading={demoLoading} leftIcon={<span>✦</span>}>
          Filled
        </Button>
        <Button intent="primary" variant="outline" loading={demoLoading}>
          Outline
        </Button>
        <Button intent="primary" variant="ghost" loading={demoLoading} rightIcon={<span>→</span>}>
          Ghost
        </Button>
        <Button intent="success" variant="subtle" loading={demoLoading}>
          Subtle
        </Button>
        <Button intent="danger" variant="filled" size="lg" loading={demoLoading}>
          Large danger
        </Button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>
        Variant × Intent (size = md)
      </h2>
      <table
        style={{
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-family-sans)',
          marginBottom: '2rem',
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>variant ↓ intent →</th>
            {INTENTS.map((intent) => (
              <th key={intent} style={{ textAlign: 'left', padding: '0.5rem' }}>{intent}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map((variant) => (
            <tr key={variant}>
              <td style={{ padding: '0.5rem', fontWeight: 500 }}>{variant}</td>
              {INTENTS.map((intent) => (
                <td key={intent} style={{ padding: '0.5rem' }}>
                  <Button variant={variant} intent={intent} data-testid={`btn-${variant}-${intent}-md-default`}>
                    Click
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>Sizes (variant=filled, intent=primary)</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        {SIZES.map((size) => (
          <Button key={size} size={size} data-testid={`btn-filled-primary-${size}-default`}>
            {size.toUpperCase()}
          </Button>
        ))}
      </div>

      <h2 style={{ fontFamily: 'var(--font-family-sans)' }}>States</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Button data-testid="btn-state-default">Default</Button>
        <Button disabled data-testid="btn-state-disabled">Disabled</Button>
        <Button loading data-testid="btn-state-loading">Loading</Button>
        <Button leftIcon={<span>+</span>} data-testid="btn-state-leftIcon">Add</Button>
        <Button rightIcon={<span>→</span>} data-testid="btn-state-rightIcon">Next</Button>
        <Button as="a" href="#nowhere" data-testid="btn-state-link">Link</Button>
      </div>

      <div style={{ width: '300px' }}>
        <Button fullWidth data-testid="btn-state-fullwidth">Full width</Button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-family-sans)', marginTop: '2rem' }}>Consolidation notes</h2>
      <ul style={{ fontFamily: 'var(--font-family-sans)', fontSize: 'var(--font-size-sm)', maxWidth: '60ch' }}>
        <li><strong>Variant axis split.</strong> the host library's mixed `primary | secondary | outline | ghost | danger | success` is now `variant × intent`: 5 visual styles × 6 semantic roles = 30 cells.</li>
        <li><strong>`isLoading` → `loading`.</strong> Renamed for soribashi convention.</li>
        <li><strong>`asChild` → `as`.</strong> Polymorphism via `as` prop. Disabled `&lt;a&gt;` uses `aria-disabled` since the HTML disabled attribute is button-only.</li>
        <li><strong>Icons.</strong> ReactNode only — IconKey / icon-component wrapping is the integration project's concern.</li>
      </ul>
    </div>
  );
}
