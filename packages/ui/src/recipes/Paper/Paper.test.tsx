import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { formatViolations, runAxe } from '../../a11y/axe.ts';
import { uiTheme } from '../../theme.ts';
import { Paper } from './Paper.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Paper (browser)', () => {
  it('default radius resolves to the theme radius-md token (6px at a 16px root)', async () => {
    const screen = await wrap(<Paper data-testid="paper">x</Paper>);
    const el = screen.getByTestId('paper').element();
    expect(getComputedStyle(el).borderRadius).toBe('6px');
  });

  it('radius="lg" resolves to the theme radius-lg token (8px)', async () => {
    const screen = await wrap(
      <Paper data-testid="paper" radius="lg">
        x
      </Paper>,
    );
    const el = screen.getByTestId('paper').element();
    expect(getComputedStyle(el).borderRadius).toBe('8px');
  });

  it('with no shadow prop, box-shadow computes to none', async () => {
    const screen = await wrap(<Paper data-testid="paper">x</Paper>);
    const el = screen.getByTestId('paper').element();
    expect(getComputedStyle(el).boxShadow).toBe('none');
  });

  it('shadow="md" resolves the theme shadow-md token to a real, non-none box-shadow', async () => {
    const screen = await wrap(
      <Paper data-testid="paper" shadow="md">
        x
      </Paper>,
    );
    const el = screen.getByTestId('paper').element();
    expect(getComputedStyle(el).boxShadow).not.toBe('none');
  });

  it('withBorder stamps data-with-border and paints the themed border', async () => {
    const screen = await wrap(
      <Paper data-testid="paper" withBorder>
        x
      </Paper>,
    );
    const el = screen.getByTestId('paper').element();
    expect(el.getAttribute('data-with-border')).toBe('true');
    expect(getComputedStyle(el).borderWidth).toBe('1px');
    expect(getComputedStyle(el).borderStyle).toBe('solid');
  });

  it('without withBorder, data-with-border is absent and no border is painted', async () => {
    const screen = await wrap(<Paper data-testid="paper">x</Paper>);
    const el = screen.getByTestId('paper').element();
    expect(el.getAttribute('data-with-border')).toBeNull();
    expect(getComputedStyle(el).borderWidth).toBe('0px');
  });

  it('background-color resolves to the theme surface-raised token (a real painted colour)', async () => {
    const screen = await wrap(<Paper data-testid="paper">x</Paper>);
    const el = screen.getByTestId('paper').element();
    expect(getComputedStyle(el).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('polymorphic as="section" renders a section element', async () => {
    const screen = await wrap(<Paper as="section">Content</Paper>);
    const el = screen.container.querySelector('section');
    expect(el).not.toBeNull();
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Paper.extend({ defaultProps: { radius: 'lg' } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Paper data-testid="paper">x</Paper>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('paper').element();
    expect(getComputedStyle(el).borderRadius).toBe('8px');
  });

  it('has zero axe violations across default, withBorder, and shadow states', async () => {
    const screen = await wrap(
      <div>
        <Paper>Default</Paper>
        <Paper withBorder>Bordered</Paper>
        <Paper shadow="md">Elevated</Paper>
      </div>,
    );
    const results = await runAxe(screen.container);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
