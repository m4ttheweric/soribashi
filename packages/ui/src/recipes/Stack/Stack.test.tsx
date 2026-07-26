import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Stack } from './Stack.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Stack (browser)', () => {
  it('default gap computes to 12px (--spacing-md)', async () => {
    const screen = await wrap(
      <Stack data-testid="stack">
        <div>a</div>
        <div>b</div>
      </Stack>,
    );
    const el = screen.getByTestId('stack').element();
    const cs = getComputedStyle(el);
    expect(cs.display).toBe('flex');
    expect(cs.flexDirection).toBe('column');
    expect(cs.gap).toBe('12px');
  });

  it('gap="xl" resolves to 24px (--spacing-xl)', async () => {
    const screen = await wrap(
      <Stack data-testid="stack" gap="xl">
        <div>a</div>
      </Stack>,
    );
    const el = screen.getByTestId('stack').element();
    expect(getComputedStyle(el).gap).toBe('24px');
  });

  it('gap={4} takes the rem() path (getSpacing(4) => 0.25rem => 4px computed)', async () => {
    const screen = await wrap(
      <Stack data-testid="stack" gap={4}>
        <div>a</div>
      </Stack>,
    );
    const el = screen.getByTestId('stack').element();
    expect(getComputedStyle(el).gap).toBe('4px');
  });

  it('align="center" computes to the requested align-items', async () => {
    const screen = await wrap(
      <Stack data-testid="stack" align="center">
        <div>a</div>
      </Stack>,
    );
    const el = screen.getByTestId('stack').element();
    expect(getComputedStyle(el).alignItems).toBe('center');
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    // Register a theme entry via Stack.extend({ defaultProps: { gap: 'xl' } })
    // in a locally-composed theme and assert the rendered gap is 24px.
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Stack.extend({ defaultProps: { gap: 'xl' } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Stack data-testid="stack">
          <div>a</div>
        </Stack>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('stack').element();
    expect(getComputedStyle(el).gap).toBe('24px');
  });
});
