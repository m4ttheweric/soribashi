import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
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
});
