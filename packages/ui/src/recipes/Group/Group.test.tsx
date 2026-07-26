import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Group } from './Group.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Group (browser)', () => {
  it('renders a row with the default gap computed to 12px (--spacing-md)', async () => {
    const screen = await wrap(
      <Group data-testid="group">
        <div>a</div>
        <div>b</div>
      </Group>,
    );
    const el = screen.getByTestId('group').element();
    const cs = getComputedStyle(el);
    expect(cs.display).toBe('flex');
    expect(cs.flexDirection).toBe('row');
    expect(cs.gap).toBe('12px');
  });

  it('wrap="nowrap" computes to the requested flex-wrap', async () => {
    const screen = await wrap(
      <Group data-testid="group" wrap="nowrap">
        <div>a</div>
      </Group>,
    );
    const el = screen.getByTestId('group').element();
    expect(getComputedStyle(el).flexWrap).toBe('nowrap');
  });

  it('grow splits two children evenly across a fixed-width row, capped by the gap', async () => {
    // Group renders as a block-level flex container inside the 300px
    // wrapper, so its own width fills the wrapper (no explicit width prop
    // needed on Group itself). With the default md gap (12px) and grow's
    // `--sb-group-child-w` capping each child at an even share, each child
    // should land at (300 - 12) / 2 = 144px (Task 6 brief's width test).
    const screen = await wrap(
      <div style={{ width: '300px' }}>
        <Group data-testid="group" grow>
          <div data-testid="a">a</div>
          <div data-testid="b">b</div>
        </Group>
      </div>,
    );
    const groupEl = screen.getByTestId('group').element();
    expect(groupEl.getAttribute('data-grow')).toBe('true');

    const expectedWidth = (300 - 12) / 2;
    const aWidth = screen.getByTestId('a').element().getBoundingClientRect().width;
    const bWidth = screen.getByTestId('b').element().getBoundingClientRect().width;
    expect(Math.abs(aWidth - expectedWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(bWidth - expectedWidth)).toBeLessThanOrEqual(1);
  });

  it('without grow, data-grow is absent', async () => {
    const screen = await wrap(
      <Group data-testid="group">
        <div>a</div>
      </Group>,
    );
    const el = screen.getByTestId('group').element();
    expect(el.hasAttribute('data-grow')).toBe(false);
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Group.extend({ defaultProps: { gap: 'xl' } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Group data-testid="group">
          <div>a</div>
        </Group>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('group').element();
    expect(getComputedStyle(el).gap).toBe('24px');
  });
});
