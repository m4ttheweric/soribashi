import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Center } from './Center.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Center (browser)', () => {
  it('renders display: flex by default, no data-inline', async () => {
    const screen = await wrap(
      <Center data-testid="center">
        <div>x</div>
      </Center>,
    );
    const el = screen.getByTestId('center').element();
    expect(getComputedStyle(el).display).toBe('flex');
    expect(el.hasAttribute('data-inline')).toBe(false);
  });

  it('centers a sized child within a sized Center (offset math)', async () => {
    const screen = await wrap(
      <Center data-testid="center" style={{ width: '200px', height: '200px' }}>
        <div data-testid="child" style={{ width: '50px', height: '50px' }} />
      </Center>,
    );
    const parentRect = screen.getByTestId('center').element().getBoundingClientRect();
    const childRect = screen.getByTestId('child').element().getBoundingClientRect();
    // (200 - 50) / 2 = 75px of empty space on each side of the 50px child.
    const expectedOffset = (200 - 50) / 2;
    expect(Math.abs(childRect.left - parentRect.left - expectedOffset)).toBeLessThanOrEqual(1);
    expect(Math.abs(childRect.top - parentRect.top - expectedOffset)).toBeLessThanOrEqual(1);
  });

  it('inline computes display: inline-flex and stamps data-inline', async () => {
    const screen = await wrap(
      <Center data-testid="center" inline>
        <div>x</div>
      </Center>,
    );
    const el = screen.getByTestId('center').element();
    expect(el.getAttribute('data-inline')).toBe('true');
    expect(getComputedStyle(el).display).toBe('inline-flex');
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Center.extend({ defaultProps: { inline: true } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Center data-testid="center">
          <div>x</div>
        </Center>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('center').element();
    expect(getComputedStyle(el).display).toBe('inline-flex');
  });
});
