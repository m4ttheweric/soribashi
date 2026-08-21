import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import {
  installNoTransitionStyle,
  NO_TRANSITION_CLASS,
  resolveCanvasColor,
  toRgbString,
} from '../../a11y/matrix-harness.tsx';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Button } from './Button.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult>
// (confirmed against the installed v2.2.0 types, which diverge from the
// brief's sketch); `wrap` awaits it so callers get the real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Button (browser)', () => {
  it('renders a real button with layered recipe styles applied', async () => {
    const screen = await wrap(<Button>Save</Button>);
    const el = screen.getByRole('button', { name: 'Save' });
    await expect.element(el).toBeVisible();
    const cs = getComputedStyle(el.element());
    expect(cs.display).toBe('inline-flex');
    expect(cs.blockSize).toBe('36px');
  });

  it('size drives the registered dimension var', async () => {
    const screen = await wrap(<Button size="xl">Big</Button>);
    const el = screen.getByRole('button', { name: 'Big' }).element();
    expect(getComputedStyle(el).blockSize).toBe('44px');
  });

  it('polymorphic as="a" renders an anchor and keeps recipe styling', async () => {
    const screen = await wrap(
      <Button as="a" href="#x">
        Go
      </Button>,
    );
    const el = screen.getByRole('link', { name: 'Go' }).element();
    expect(el.tagName).toBe('A');
    expect(getComputedStyle(el).display).toBe('inline-flex');
  });

  it('intent and variant resolve different backgrounds', async () => {
    const screen = await wrap(
      <div>
        <Button intent="primary">P</Button>
        <Button intent="danger">D</Button>
        <Button intent="primary" variant="outline">
          O
        </Button>
      </div>,
    );
    const bg = (name: string) =>
      getComputedStyle(screen.getByRole('button', { name }).element()).backgroundColor;
    expect(bg('P')).not.toBe(bg('D'));
    expect(bg('P')).not.toBe(bg('O'));
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    // Register a theme entry via Button.extend({ defaultProps: { size: 'xs' } })
    // in a locally-composed theme and assert the rendered height is 28px.
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Button.extend({ defaultProps: { size: 'xs' } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Button>Tiny</Button>
      </SoribashiProvider>,
    );
    const el = screen.getByRole('button', { name: 'Tiny' }).element();
    expect(getComputedStyle(el).blockSize).toBe('28px');
  });

  it('accepts universal style props with zero recipe changes (p="md" resolves to the theme spacing token)', async () => {
    // Button.tsx is untouched by Task 2: style props are wired into every
    // recipe at the builder level (definePolymorphicComponent), so this pins
    // that the recipe file needed zero changes to gain them.
    const screen = await wrap(<Button p="md">Padded</Button>);
    const el = screen.getByRole('button', { name: 'Padded' }).element();
    // uiTheme's --spacing-md resolves to 12px (0.75rem at a 16px root).
    expect(getComputedStyle(el).padding).toBe('12px');
  });

  it('has zero axe violations across its showcase states (intent x variant, sizes, disabled)', async () => {
    // Mirrors apps/workshop/src/pages/ButtonPage.tsx's showcase sections so
    // the axe case exercises the same combinations a person would actually
    // see, sourced from uiVocabulary rather than hand-copied value lists.
    const intents = uiVocabulary.intent.values;
    const variants = uiVocabulary.variant.values;
    const sizes = uiVocabulary.size.values;

    const screen = await wrap(
      <div>
        {intents.map((intent) =>
          variants.map((variant) => (
            <Button key={`${intent}-${variant}`} intent={intent} variant={variant}>
              {intent}
            </Button>
          )),
        )}
        {sizes.map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
        {variants.map((variant) => (
          <Button key={`disabled-${variant}`} variant={variant} disabled>
            {variant}
          </Button>
        ))}
      </div>,
    );

    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });

  it('paints a hover wash on a neutral subtle button that is distinct from the canvas (real pointer hover)', async () => {
    // Transitions disabled before hovering, same mechanism
    // matrix-harness.tsx installs for the grid and small-coverage contrast
    // reads: Button's background-color transition (Button.module.css)
    // interpolates only the alpha channel while holding the target RGB
    // constant (empirically confirmed against this Chromium build), so a
    // value read mid-transition differs from BOTH the rest-state (alpha 0)
    // and the settled hover colour purely by alpha, satisfying a loose
    // "not equal to either" poll on the very first sample regardless of
    // whether the settled colour is actually distinct from canvas. That
    // makes an un-stabilized poll pass even when the wash regresses to
    // canvas. Disabling the transition removes the race without touching
    // whether `:hover` matches, since a real pointer hover, not a class
    // toggle, is still what drives it.
    const removeNoTransitionStyle = installNoTransitionStyle();
    try {
      const screen = await wrap(
        <Button intent="neutral" variant="subtle" classNames={{ root: 'probe-wash' }}>
          Subtle
        </Button>,
      );
      const root = screen.container.querySelector('.probe-wash') as HTMLElement;
      root.classList.add(NO_TRANSITION_CLASS);
      const canvas = toRgbString(resolveCanvasColor(root));

      await screen.getByRole('button').hover();

      // Poll rather than assert once: even with transitions disabled, this
      // still waits out any async gap between the pointer event and the
      // browser applying `:hover`, rather than assuming it is synchronous.
      await vi.waitFor(() => {
        const hovered = getComputedStyle(root).backgroundColor;
        // Not transparent (the rest-state subtle background) ...
        expect(toRgbString(hovered)).not.toBe(toRgbString('rgba(0, 0, 0, 0)'));
        // ... and not the canvas colour itself: the wash must be VISIBLE.
        expect(toRgbString(hovered)).not.toBe(canvas);
      });
    } finally {
      removeNoTransitionStyle();
    }
  });
});
