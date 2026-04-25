import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Box } from '../../src/Box/Box.tsx';

const theme = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: {},
    fontSize: {},
    breakpoint: {},
  },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('Box — visibility classes', () => {
  it('hiddenFrom="md" adds sb-hidden-from-md class', () => {
    const { container } = wrap(<Box hiddenFrom="md">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-hidden-from-md');
  });

  it('hiddenFrom="sm" adds sb-hidden-from-sm class', () => {
    const { container } = wrap(<Box hiddenFrom="sm">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-hidden-from-sm');
  });

  it('visibleFrom="lg" adds sb-visible-from-lg class', () => {
    const { container } = wrap(<Box visibleFrom="lg">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-visible-from-lg');
  });

  it('lightHidden adds sb-light-hidden class', () => {
    const { container } = wrap(<Box lightHidden>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-light-hidden');
  });

  it('darkHidden adds sb-dark-hidden class', () => {
    const { container } = wrap(<Box darkHidden>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-dark-hidden');
  });

  it('visibility classes stack with base sb-Box-root class', () => {
    const { container } = wrap(<Box hiddenFrom="md" lightHidden>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).toContain('sb-Box-root');
    expect(el.className).toContain('sb-hidden-from-md');
    expect(el.className).toContain('sb-light-hidden');
  });

  it('no visibility class when props are absent', () => {
    const { container } = wrap(<Box>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.className).not.toContain('sb-hidden-from');
    expect(el.className).not.toContain('sb-visible-from');
    expect(el.className).not.toContain('sb-light-hidden');
    expect(el.className).not.toContain('sb-dark-hidden');
  });
});
