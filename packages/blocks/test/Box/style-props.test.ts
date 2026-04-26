import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { parseStyleProps } from '../../src/Box/style-props/parse-style-props.ts';
import { extractStyleProps } from '../../src/Box/style-props/extract-style-props.ts';
import { STYLE_PROPS_DATA } from '../../src/Box/style-props/style-props-data.ts';
import { getBoxMod } from '../../src/Box/get-box-mod.ts';

const theme = createTheme({
  tokens: {
    colors: {},
    radius: { md: '0.5rem' },
    spacing: { sm: '0.5rem', md: '0.75rem', lg: '1rem' },
    fontSize: {},
    breakpoint: { xs: '24rem', sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' },
  },
});

describe('parseStyleProps', () => {
  it('resolves a flat spacing value to inlineStyles', () => {
    const result = parseStyleProps({
      styleProps: { p: 'md' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.padding).toBe('var(--spacing-md)');
    expect(result.hasResponsiveStyles).toBe(false);
  });

  it('resolves number values to rem', () => {
    const result = parseStyleProps({
      styleProps: { mt: 16 },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.marginTop).toBe('1rem');
  });

  it('resolves mx to marginInline logical shorthand (Mantine parity)', () => {
    const result = parseStyleProps({
      styleProps: { mx: 'md' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    // Mantine: mx → marginInline (not separate start/end)
    expect(result.inlineStyles.marginInline).toBe('var(--spacing-md)');
  });

  it('responsive value: base goes to styles; breakpoints go to media', () => {
    const result = parseStyleProps({
      styleProps: { p: { base: 'sm', md: 'lg' } },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.hasResponsiveStyles).toBe(true);
    expect(result.styles.padding).toBe('var(--spacing-sm)');
    expect(result.media['(min-width: 48rem)']?.padding).toBe('var(--spacing-lg)');
  });

  it('hasResponsiveStyles flag stays false when only flat values are passed', () => {
    const result = parseStyleProps({
      styleProps: { p: 'md', mt: 'sm' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.hasResponsiveStyles).toBe(false);
  });

  it('skips unknown props (no entry in data)', () => {
    const result = parseStyleProps({
      styleProps: { p: 'md', unknownProp: 'value' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles).toEqual({ padding: 'var(--spacing-md)' });
  });

  it('resolves bg through theme color resolver', () => {
    const result = parseStyleProps({
      styleProps: { bg: 'surface.raised' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.background).toBe('var(--surface-raised)');
  });

  it('resolves fz through font-size resolver', () => {
    const result = parseStyleProps({
      styleProps: { fz: 'lg' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.fontSize).toBe('var(--font-size-lg)');
  });
});

describe('extractStyleProps', () => {
  it('splits style props from passthrough props', () => {
    const { styleProps, rest } = extractStyleProps(
      {
        p: 'md',
        mt: 'lg',
        id: 'my-id',
        onClick: () => {},
        'data-foo': 'bar',
      },
      STYLE_PROPS_DATA,
    );

    expect(styleProps).toEqual({ p: 'md', mt: 'lg' });
    expect(rest.id).toBe('my-id');
    expect(typeof rest.onClick).toBe('function');
    expect(rest['data-foo']).toBe('bar');
  });
});

describe('getBoxMod', () => {
  it('handles string input', () => {
    expect(getBoxMod('active')).toEqual({ 'data-active': true });
  });

  it('handles record input — boolean true → true', () => {
    expect(getBoxMod({ active: true })).toEqual({ 'data-active': true });
  });

  it('handles record input — false/null/undefined/"" are omitted; numeric 0 is kept (Mantine parity)', () => {
    // Mantine getMod filters: undefined, '', false, null — but NOT numeric 0.
    // See: packages/@mantine/core/src/core/Box/get-box-mod/get-box-mod.ts (63dafbbf)
    expect(getBoxMod({ active: true, loading: false, x: null, y: undefined, z: 0, q: '' })).toEqual({
      'data-active': true,
      'data-z': 0,
    });
  });

  it('truthy non-boolean values become the data-attribute value', () => {
    expect(getBoxMod({ size: 'lg' })).toEqual({ 'data-size': 'lg' });
  });

  it('preserves keys that already start with data-', () => {
    expect(getBoxMod({ 'data-state': 'open' })).toEqual({ 'data-state': 'open' });
  });

  it('handles array input — merges items', () => {
    expect(getBoxMod([{ active: true }, 'open', { size: 'lg' }])).toEqual({
      'data-active': true,
      'data-open': true,
      'data-size': 'lg',
    });
  });

  it('returns empty object for undefined', () => {
    expect(getBoxMod(undefined)).toEqual({});
  });
});

describe('ff resolver — fontFamily aliases', () => {
  it('ff="mono" → fontFamily: var(--font-family-mono)', () => {
    const result = parseStyleProps({ styleProps: { ff: 'mono' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontFamily).toBe('var(--font-family-mono)');
  });
  it('ff="heading" → fontFamily: var(--font-family-heading)', () => {
    const result = parseStyleProps({ styleProps: { ff: 'heading' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontFamily).toBe('var(--font-family-heading)');
  });
  it('ff="serif" passes through', () => {
    const result = parseStyleProps({ styleProps: { ff: 'serif' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontFamily).toBe('serif');
  });
});
