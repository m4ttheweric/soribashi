import { SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Badge } from './Badge.tsx';

const INTENTS = uiVocabulary.intent.values;
const VARIANTS = ['filled', 'outline', 'subtle'] as const;
const SIZES = uiVocabulary.size.values;

/**
 * Same rationale as Alert.visual.test.tsx and Button.visual.test.tsx:
 * baselines here are for geometry/borders/radii/typography, not colour
 * correctness (that's a11y/contrast-matrix.test.tsx's job against the full
 * intent x variant grid). Badge.module.css has no transitions today, but the
 * no-transition wrapper is kept anyway so a future transition addition can't
 * silently introduce a mid-animation capture here without anyone noticing
 * the class was already there to prevent it.
 */
const NO_TRANSITION_CLASS = 'sb-visual-no-transition';
const noTransitionStyle = document.createElement('style');
noTransitionStyle.textContent = `
  .${NO_TRANSITION_CLASS},
  .${NO_TRANSITION_CLASS} * { transition: none !important; }
`;
document.head.appendChild(noTransitionStyle);

/**
 * Mounts `ui` inside a fresh container appended to `document.body` before
 * render, with the `dark` class (when requested) already present on the
 * container pre-mount so the very first paint is dark. See
 * Button.visual.test.tsx's identical helper for the full rationale.
 */
async function renderFixture(ui: React.ReactNode, { dark = false } = {}) {
  await page.viewport(900, 700);

  const container = document.createElement('div');
  container.className = NO_TRANSITION_CLASS;
  if (dark) container.classList.add('dark');
  document.body.appendChild(container);
  const screen = await render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>, {
    container,
  });
  await document.fonts.ready;
  return screen;
}

function IntentVariantGrid() {
  return (
    <div
      data-testid="grid"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '1rem',
        background: 'var(--surface-canvas)',
      }}
    >
      {INTENTS.map((intent) => (
        <div key={intent} style={{ display: 'flex', gap: '0.5rem' }}>
          {VARIANTS.map((variant) => (
            <Badge key={`${intent}-${variant}`} intent={intent} variant={variant}>
              {intent}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  );
}

describe('Badge (visual)', () => {
  it('intent x variant grid matches its baseline in light mode', async () => {
    await renderFixture(<IntentVariantGrid />);

    await expect(page.getByTestId('grid')).toMatchScreenshot('badge-grid-light');
  });

  it('intent x variant grid matches its baseline in dark mode', async () => {
    await renderFixture(<IntentVariantGrid />, { dark: true });

    await expect(page.getByTestId('grid')).toMatchScreenshot('badge-grid-dark');
  });

  it('size row matches its baseline', async () => {
    await renderFixture(
      <div
        data-testid="size-row"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          background: 'var(--surface-canvas)',
        }}
      >
        {SIZES.map((size) => (
          <Badge key={size} size={size}>
            {size}
          </Badge>
        ))}
      </div>,
    );

    await expect(page.getByTestId('size-row')).toMatchScreenshot('badge-size-row');
  });
});
