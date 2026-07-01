import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Box } from '../../src/Box/Box.tsx';

const theme = createTheme({
  tokens: {
    colors: {
      primary: { '500': 'hsl(217 91% 60%)' },
      neutral: { '0': '#fff', '100': '#eee' },
    },
    radius: {},
    spacing: { sm: '0.5rem', md: '0.75rem' },
    fontSize: {},
  },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('theme-aware color resolution', () => {
  it('resolves bare names that are theme color families', () => {
    const { container } = wrap(<Box c="primary">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.color).toBe('var(--color-primary-500)');
  });

  it('passes bare CSS color names through when not in theme colors', () => {
    const { container } = wrap(
      <Box c="white" bg="black">
        X
      </Box>,
    );
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.color).toBe('white');
    expect(el.style.background).toBe('black');
  });

  it('passes CSS color names through inside bd shorthand', () => {
    const { container } = wrap(<Box bd="1px solid red">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.border).toBe('0.0625rem solid red');
  });

  it('resolves theme families inside bd shorthand', () => {
    const { container } = wrap(<Box bd="1px solid primary.500">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.border).toBe('0.0625rem solid var(--color-primary-500)');
  });

  it('keeps keywords working, including lowercase currentcolor', () => {
    for (const keyword of ['transparent', 'inherit', 'currentColor', 'currentcolor']) {
      const { container } = wrap(<Box c={keyword}>X</Box>);
      const el = container.querySelector('div') as HTMLElement;
      // jsdom normalizes color keyword casing, so compare case-insensitively
      expect(el.style.color.toLowerCase()).toBe(keyword.toLowerCase());
    }
  });

  it('still resolves semantic surface/text/border refs', () => {
    const { container } = wrap(<Box bg="surface.raised" c="text.muted">X</Box>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.background).toBe('var(--surface-raised)');
    expect(el.style.color).toBe('var(--text-muted)');
  });
});
