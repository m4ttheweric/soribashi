import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme } from '../../theme.ts';
import { Title } from './Title.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

// uiTheme's defaultTokens.heading.sizes (packages/theme/src/tokens/default-tokens.ts):
// every order's font-weight is 700; font-size/line-height vary per order.
const HEADING_TOKENS: Record<1 | 2 | 3 | 4 | 5 | 6, { fontSizePx: number; lineHeight: number }> = {
  1: { fontSizePx: 34, lineHeight: 1.3 },
  2: { fontSizePx: 26, lineHeight: 1.35 },
  3: { fontSizePx: 22, lineHeight: 1.4 },
  4: { fontSizePx: 18, lineHeight: 1.45 },
  5: { fontSizePx: 16, lineHeight: 1.5 },
  6: { fontSizePx: 14, lineHeight: 1.5 },
};

describe('Title (browser)', () => {
  it('defaults to order=1, renders an <h1>, and stamps data-order="1"', async () => {
    const screen = await wrap(<Title data-testid="title">Heading</Title>);
    const el = screen.getByTestId('title').element();
    expect(el.tagName).toBe('H1');
    expect(el.getAttribute('data-order')).toBe('1');
  });

  it.each([1, 2, 3, 4, 5, 6] as const)(
    'order=%s renders the matching h-element and computes that order’s heading tokens',
    async (order) => {
      const screen = await wrap(
        <Title data-testid="title" order={order}>
          Heading {order}
        </Title>,
      );
      const el = screen.getByTestId('title').element();
      expect(el.tagName).toBe(`H${order}`);
      expect(el.getAttribute('data-order')).toBe(String(order));
      const cs = getComputedStyle(el);
      const expected = HEADING_TOKENS[order];
      expect(cs.fontSize).toBe(`${expected.fontSizePx}px`);
      expect(cs.fontWeight).toBe('700');
      expect(Number.parseFloat(cs.lineHeight)).toBeCloseTo(
        expected.fontSizePx * expected.lineHeight,
        1,
      );
    },
  );

  it('font-family resolves to the theme heading font-family token', async () => {
    const screen = await wrap(<Title data-testid="title">Heading</Title>);
    const el = screen.getByTestId('title').element();
    expect(getComputedStyle(el).fontFamily).toContain('Inter');
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Title.extend({ defaultProps: { order: 3 } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Title data-testid="title">Heading</Title>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('title').element();
    expect(el.tagName).toBe('H3');
  });

  it('has zero axe violations across an order 1-6 stack', async () => {
    const screen = await wrap(
      <div>
        {([1, 2, 3, 4, 5, 6] as const).map((order) => (
          <Title key={order} order={order}>
            Heading level {order}
          </Title>
        ))}
      </div>,
    );
    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
