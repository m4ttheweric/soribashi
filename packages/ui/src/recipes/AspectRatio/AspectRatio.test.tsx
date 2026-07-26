import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { AspectRatio } from './AspectRatio.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('AspectRatio (browser)', () => {
  it('default ratio computes aspect-ratio: 1', async () => {
    const screen = await wrap(
      <AspectRatio data-testid="ar">
        <div />
      </AspectRatio>,
    );
    const el = screen.getByTestId('ar').element();
    // getComputedStyle always serializes aspect-ratio in `<width> / <height>`
    // form, even when the CSS source is a bare number (browsers normalize
    // `1` to `1 / 1` on the computed-style API, not just the used value).
    expect(getComputedStyle(el).aspectRatio).toBe('1 / 1');
  });

  it('ratio={16/9} on a width-300px element computes height within 1px of 168.75', async () => {
    const screen = await wrap(
      <AspectRatio data-testid="ar" ratio={16 / 9} style={{ width: '300px' }}>
        <div />
      </AspectRatio>,
    );
    const el = screen.getByTestId('ar').element();
    const rect = el.getBoundingClientRect();
    const expectedHeight = 300 / (16 / 9); // 168.75
    expect(Math.abs(rect.height - expectedHeight)).toBeLessThanOrEqual(1);
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [AspectRatio.extend({ defaultProps: { ratio: 2 } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <AspectRatio data-testid="ar">
          <div />
        </AspectRatio>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('ar').element();
    expect(getComputedStyle(el).aspectRatio).toBe('2 / 1');
  });
});
