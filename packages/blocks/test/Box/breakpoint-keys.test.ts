import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { parseStyleProps } from '../../src/Box/style-props/parse-style-props.ts';
import { STYLE_PROPS_DATA } from '../../src/Box/style-props/style-props-data.ts';

const themeWithWideBreakpoints = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: { sm: '0.5rem', md: '0.75rem', lg: '1rem' },
    fontSize: {},
    breakpoint: {
      xs: '24rem',
      sm: '40rem',
      md: '48rem',
      lg: '64rem',
      xl: '80rem',
      '2xl': '96rem',
      '3xl': '120rem',
    },
  },
});

const themeWithCustomBreakpoints = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: { sm: '0.5rem', md: '0.75rem' },
    fontSize: {},
    breakpoint: { phone: '30rem', desktop: '64rem' },
  },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('breakpoint keys derived from theme', () => {
  it('resolves 2xl/3xl breakpoints present in the theme', () => {
    const result = parseStyleProps({
      styleProps: { p: { base: 'sm', '2xl': 'lg', '3xl': 'md' } },
      data: STYLE_PROPS_DATA,
      theme: themeWithWideBreakpoints,
    });
    expect(result.media['(min-width: 96rem)']?.padding).toBe('var(--spacing-lg)');
    expect(result.media['(min-width: 120rem)']?.padding).toBe('var(--spacing-md)');
  });

  it('resolves custom theme breakpoint keys', () => {
    const result = parseStyleProps({
      styleProps: { p: { base: 'sm', phone: 'md' } },
      data: STYLE_PROPS_DATA,
      theme: themeWithCustomBreakpoints,
    });
    expect(result.hasResponsiveStyles).toBe(true);
    expect(result.media['(min-width: 30rem)']?.padding).toBe('var(--spacing-md)');
  });
});

describe('guard against unresolvable inputs', () => {
  it('emits nothing for a responsive object with only unknown keys', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseStyleProps({
      styleProps: { p: { wat: 'md' } },
      data: STYLE_PROPS_DATA,
      theme: themeWithWideBreakpoints,
    });
    expect(result.inlineStyles.padding).toBeUndefined();
    expect(Object.keys(result.media)).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain('[object Object]');
    expect(warn).toHaveBeenCalled();
  });

  it('emits nothing for non-string/non-number breakpoint values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseStyleProps({
      styleProps: { p: { base: 'sm', md: { oops: 1 } } },
      data: STYLE_PROPS_DATA,
      theme: themeWithWideBreakpoints,
    });
    expect(Object.keys(result.media)).toHaveLength(0);
    expect(JSON.stringify(result)).not.toContain('[object Object]');
    expect(warn).toHaveBeenCalled();
  });

  it('emits nothing for a non-string/non-number flat value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseStyleProps({
      styleProps: { p: true },
      data: STYLE_PROPS_DATA,
      theme: themeWithWideBreakpoints,
    });
    expect(result.inlineStyles.padding).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
