import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme } from '../../theme.ts';
import { Text } from './Text.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Text (browser)', () => {
  it('renders a <p> by default, stamps data-size="md", and computes the md size tokens', async () => {
    const screen = await wrap(<Text data-testid="text">Body copy</Text>);
    const el = screen.getByTestId('text').element();
    expect(el.tagName).toBe('P');
    expect(el.getAttribute('data-size')).toBe('md');
    const cs = getComputedStyle(el);
    // uiTheme's --font-size-md is 1rem (16px at a 16px root).
    expect(cs.fontSize).toBe('16px');
    // --line-height-md is the unitless multiplier 1.55; the computed (used)
    // line-height is that multiplier resolved against the computed font-size.
    expect(Number.parseFloat(cs.lineHeight)).toBeCloseTo(16 * 1.55, 1);
  });

  it('size="lg" resolves both --sb-text-fz and --sb-text-lh to the lg tokens', async () => {
    const screen = await wrap(
      <Text data-testid="text" size="lg">
        Body copy
      </Text>,
    );
    const el = screen.getByTestId('text').element();
    const cs = getComputedStyle(el);
    // --font-size-lg is 1.125rem (18px).
    expect(cs.fontSize).toBe('18px');
    // --line-height-lg is the unitless multiplier 1.6.
    expect(Number.parseFloat(cs.lineHeight)).toBeCloseTo(18 * 1.6, 1);
  });

  it('dimmed stamps data-dimmed and renders a visibly different (muted) colour', async () => {
    const screen = await wrap(
      <div>
        <Text data-testid="default">Default</Text>
        <Text data-testid="dimmed" dimmed>
          Dimmed
        </Text>
      </div>,
    );
    const defaultEl = screen.getByTestId('default').element();
    const dimmedEl = screen.getByTestId('dimmed').element();
    expect(dimmedEl.getAttribute('data-dimmed')).toBe('true');
    expect(defaultEl.getAttribute('data-dimmed')).toBeNull();
    expect(getComputedStyle(dimmedEl).color).not.toBe(getComputedStyle(defaultEl).color);
  });

  it('truncate stamps data-truncate and computes the single-line ellipsis declarations', async () => {
    const screen = await wrap(
      <Text data-testid="text" truncate>
        A very long line of text that should be clipped with an ellipsis
      </Text>,
    );
    const el = screen.getByTestId('text').element();
    expect(el.getAttribute('data-truncate')).toBe('true');
    const cs = getComputedStyle(el);
    expect(cs.overflow).toBe('hidden');
    expect(cs.textOverflow).toBe('ellipsis');
    expect(cs.whiteSpace).toBe('nowrap');
  });

  it('without truncate, data-truncate is absent and overflow is not clipped', async () => {
    const screen = await wrap(<Text data-testid="text">Body copy</Text>);
    const el = screen.getByTestId('text').element();
    expect(el.getAttribute('data-truncate')).toBeNull();
    expect(getComputedStyle(el).overflow).toBe('visible');
  });

  it('as="span" renders a span element instead of the default p', async () => {
    const screen = await wrap(<Text as="span">Inline copy</Text>);
    const el = screen.container.querySelector('span');
    expect(el).not.toBeNull();
    expect(screen.container.querySelector('p')).toBeNull();
  });

  it('fw="semibold" resolves the theme font-weight token to a computed 600', async () => {
    // Text.tsx declares NO own `fw` prop: `fw` is a STYLE_PROPS_DATA key,
    // now resolved by getFontWeight, which resolves a bare theme token key
    // the way fz/lh/ff do. `fw="semibold"` becomes var(--font-weight-semibold)
    // (the theme token is 600), so it computes to 600. The earlier identity
    // resolver left "semibold" as an invalid raw value that computed to 400.
    const screen = await wrap(
      <Text data-testid="text" fw="semibold">
        Emphasized copy
      </Text>,
    );
    const el = screen.getByTestId('text').element();
    expect(getComputedStyle(el).fontWeight).toBe('600');
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Text.extend({ defaultProps: { size: 'xl' } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Text data-testid="text">Body copy</Text>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('text').element();
    // --font-size-xl is 1.25rem (20px).
    expect(getComputedStyle(el).fontSize).toBe('20px');
  });

  it('has zero axe violations across default, dimmed, and truncated states', async () => {
    const screen = await wrap(
      <div>
        <Text>Default copy</Text>
        <Text dimmed>Dimmed copy</Text>
        <Text truncate>Truncated copy</Text>
      </div>,
    );
    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
