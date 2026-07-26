import { createTheme, SoribashiProvider } from '@soribashi/core';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { uiTheme } from '../../theme.ts';
import { Container } from './Container.tsx';

// `render` from vitest-browser-react resolves a Promise<RenderResult> (see
// Button.test.tsx's identical note); `wrap` awaits it so callers get the
// real result object.
const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={uiTheme}>{ui}</SoribashiProvider>);

describe('Container (browser)', () => {
  it('default size computes to 48rem max-width (768px at a 16px root) and stamps data-size', async () => {
    const screen = await wrap(<Container data-testid="container">x</Container>);
    const el = screen.getByTestId('container').element();
    expect(getComputedStyle(el).maxWidth).toBe('768px');
    expect(el.getAttribute('data-size')).toBe('md');
  });

  it('size="xl" resolves to 80rem (1280px)', async () => {
    const screen = await wrap(
      <Container data-testid="container" size="xl">
        x
      </Container>,
    );
    const el = screen.getByTestId('container').element();
    expect(getComputedStyle(el).maxWidth).toBe('1280px');
  });

  it('fluid removes the max-width cap and stamps data-fluid', async () => {
    const screen = await wrap(
      <Container data-testid="container" fluid>
        x
      </Container>,
    );
    const el = screen.getByTestId('container').element();
    expect(el.getAttribute('data-fluid')).toBe('true');
    expect(getComputedStyle(el).maxWidth).toBe('100%');
  });

  it('padding-inline resolves to the theme spacing-md token (12px)', async () => {
    const screen = await wrap(<Container data-testid="container">x</Container>);
    const el = screen.getByTestId('container').element();
    const cs = getComputedStyle(el);
    expect(cs.paddingLeft).toBe('12px');
    expect(cs.paddingRight).toBe('12px');
  });

  it('extend threads defaultProps (invariant 1 stays load-bearing)', async () => {
    // Register a theme entry via Container.extend({ defaultProps: { size: 'xl' } })
    // in a locally-composed theme (mirrors Button.test.tsx's extend test) and
    // assert the rendered max-width is 80rem (1280px).
    const extendedTheme = createTheme({
      extends: uiTheme,
      components: [Container.extend({ defaultProps: { size: 'xl' } })],
    });
    const screen = await render(
      <SoribashiProvider theme={extendedTheme}>
        <Container data-testid="container">x</Container>
      </SoribashiProvider>,
    );
    const el = screen.getByTestId('container').element();
    expect(getComputedStyle(el).maxWidth).toBe('1280px');
  });
});
