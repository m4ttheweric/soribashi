import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme, uiVocabulary } from '../../theme.ts';
import { Badge } from './Badge.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult>; `wrap`
// awaits it so callers get the real result object (see Button.test.tsx).
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Badge (browser)', () => {
  it('renders a span by default and honours `as`', async () => {
    const screen = await wrap(<Badge classNames={{ root: 'probe' }}>New</Badge>);
    expect(screen.container.querySelector('.probe')!.tagName).toBe('SPAN');

    const asLink = await wrap(
      <Badge as="a" href="#x" classNames={{ root: 'probe-a' }}>
        New
      </Badge>,
    );
    expect(asLink.container.querySelector('.probe-a')!.tagName).toBe('A');
  });

  it('grows in height across the size vocabulary (computed)', async () => {
    const screen = await wrap(
      <>
        <Badge size="xs" classNames={{ root: 'probe-xs' }}>
          x
        </Badge>
        <Badge size="xl" classNames={{ root: 'probe-xl' }}>
          x
        </Badge>
      </>,
    );
    const xs = parseFloat(getComputedStyle(screen.container.querySelector('.probe-xs')!).height);
    const xl = parseFloat(getComputedStyle(screen.container.querySelector('.probe-xl')!).height);
    expect(xl).toBeGreaterThan(xs);
  });

  it('threads a size default through Recipe.extend (invariant 1)', async () => {
    // Register a theme entry via Badge.extend({ defaultProps: { size: 'xl' } })
    // in a locally-composed theme, and assert its rendered (unset-size)
    // computed height equals an explicit size="xl" Badge's computed height
    // rendered under the plain uiTheme. If .extend({ defaultProps }) stopped
    // threading, `Big` would fall back to Badge's own built-in default size
    // ('md'), and this equality would fail rather than the two heights
    // matching by coincidence: 'md' and 'xl' resolve to different
    // BADGE_HEIGHTS entries.
    const Big = Badge.extend({ defaultProps: { size: 'xl' } });
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Big],
    });

    const extendedScreen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Badge classNames={{ root: 'probe-extended' }}>Big</Badge>
      </SoribashiProvider>,
    );
    const explicitScreen = await wrap(
      <Badge size="xl" classNames={{ root: 'probe-explicit-xl' }}>
        Big
      </Badge>,
    );

    const extendedHeight = getComputedStyle(
      extendedScreen.container.querySelector('.probe-extended')!,
    ).height;
    const explicitHeight = getComputedStyle(
      explicitScreen.container.querySelector('.probe-explicit-xl')!,
    ).height;
    expect(extendedHeight).toBe(explicitHeight);
  });

  it('intent and variant resolve different backgrounds', async () => {
    const screen = await wrap(
      <div>
        <Badge intent="primary" classNames={{ root: 'probe-primary' }}>
          P
        </Badge>
        <Badge intent="danger" classNames={{ root: 'probe-danger' }}>
          D
        </Badge>
        <Badge intent="primary" variant="outline" classNames={{ root: 'probe-outline' }}>
          O
        </Badge>
      </div>,
    );
    const bg = (selector: string) =>
      getComputedStyle(screen.container.querySelector(selector)!).backgroundColor;
    expect(bg('.probe-primary')).not.toBe(bg('.probe-danger'));
    expect(bg('.probe-primary')).not.toBe(bg('.probe-outline'));
  });

  it('accepts style props from the builder with no recipe wiring', async () => {
    const screen = await wrap(
      <Badge classNames={{ root: 'probe-sp' }} p="xl">
        x
      </Badge>,
    );
    const padding = getComputedStyle(screen.container.querySelector('.probe-sp')!).padding;
    expect(padding).not.toBe('0px');
  });

  it('has zero axe violations across its showcase states (intent x variant, sizes)', async () => {
    const intents = uiVocabulary.intent.values;
    const variants = ['filled', 'outline', 'subtle'] as const;
    const sizes = uiVocabulary.size.values;

    const screen = await wrap(
      <div>
        {intents.map((intent) =>
          variants.map((variant) => (
            <Badge key={`${intent}-${variant}`} intent={intent} variant={variant}>
              {intent}
            </Badge>
          )),
        )}
        {sizes.map((size) => (
          <Badge key={size} size={size}>
            {size}
          </Badge>
        ))}
      </div>,
    );

    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
