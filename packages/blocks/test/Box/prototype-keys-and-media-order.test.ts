import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { parseStyleProps } from '../../src/Box/style-props/parse-style-props.ts';
import { extractStyleProps } from '../../src/Box/style-props/extract-style-props.ts';
import { STYLE_PROPS_DATA } from '../../src/Box/style-props/style-props-data.ts';

const theme = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: { sm: '0.5rem', md: '0.75rem', lg: '1rem' },
    fontSize: {},
    breakpoint: { xs: '24rem', sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' },
  },
});

describe('prototype key safety', () => {
  it('extractStyleProps routes prototype-named props to rest, not styleProps', () => {
    const { styleProps, rest } = extractStyleProps(
      { constructor: 'x', toString: 'y', p: 'md' },
      STYLE_PROPS_DATA,
    );
    expect(styleProps).toEqual({ p: 'md' });
    expect(rest).toEqual({ constructor: 'x', toString: 'y' });
  });

  it('parseStyleProps ignores prototype-named entries without crashing', () => {
    const result = parseStyleProps({
      styleProps: { constructor: 'x', p: 'md' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles).toEqual({ padding: 'var(--spacing-md)' });
  });
});

describe('media query emission order', () => {
  it('sorts media rules ascending by min-width regardless of source order', () => {
    const result = parseStyleProps({
      styleProps: { ms: { md: 'lg' }, mis: { sm: 'sm' } },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(Object.keys(result.media)).toEqual([
      '(min-width: 40rem)',
      '(min-width: 48rem)',
    ]);
  });

  it('sorts across multiple props and breakpoints', () => {
    const result = parseStyleProps({
      styleProps: { p: { xl: 'lg' }, m: { xs: 'sm', lg: 'md' } },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(Object.keys(result.media)).toEqual([
      '(min-width: 24rem)',
      '(min-width: 64rem)',
      '(min-width: 80rem)',
    ]);
  });
});
