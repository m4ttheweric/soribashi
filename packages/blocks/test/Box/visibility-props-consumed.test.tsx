import { SoribashiProvider } from '@soribashi/factory';
import { createTheme } from '@soribashi/theme';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

describe('Box — visibility props do not leak to DOM', () => {
  it('hiddenFrom is not set as a DOM attribute', () => {
    const { container } = wrap(<Box hiddenFrom="md">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.hasAttribute('hiddenfrom')).toBe(false);
    expect(el.hasAttribute('hiddenFrom')).toBe(false);
    expect(el.hasAttribute('hidden-from')).toBe(false);
  });

  it('visibleFrom is not set as a DOM attribute', () => {
    const { container } = wrap(<Box visibleFrom="sm">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.hasAttribute('visiblefrom')).toBe(false);
    expect(el.hasAttribute('visibleFrom')).toBe(false);
  });

  it('sx is not set as a DOM attribute', () => {
    const { container } = wrap(<Box sx={{}}>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.hasAttribute('sx')).toBe(false);
  });

  it('lightHidden is not set as a DOM attribute', () => {
    const { container } = wrap(<Box lightHidden>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.hasAttribute('lighthidden')).toBe(false);
    expect(el.hasAttribute('lightHidden')).toBe(false);
  });

  it('darkHidden is not set as a DOM attribute', () => {
    const { container } = wrap(<Box darkHidden>X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.hasAttribute('darkhidden')).toBe(false);
    expect(el.hasAttribute('darkHidden')).toBe(false);
  });

  it('all visibility props together - none appear as DOM attributes', () => {
    const { container } = wrap(
      <Box hiddenFrom="md" visibleFrom="sm" sx={{}} lightHidden darkHidden>
        X
      </Box>,
    );
    const el = container.querySelector('div') as HTMLElement;
    const attrNames = Array.from(el.attributes).map((a) => a.name.toLowerCase());
    expect(attrNames).not.toContain('hiddenfrom');
    expect(attrNames).not.toContain('visiblefrom');
    expect(attrNames).not.toContain('sx');
    expect(attrNames).not.toContain('lighthidden');
    expect(attrNames).not.toContain('darkhidden');
  });
});
