import { describe, expect, it } from 'vitest';
import { extractStyleProps } from '../../../src/factory/style-props/extract-style-props.ts';
import { parseStyleProps } from '../../../src/factory/style-props/parse-style-props.ts';
import { STYLE_PROPS_DATA } from '../../../src/factory/style-props/style-props-data.ts';
import { createTheme } from '../../../src/theme/index.ts';

const theme = createTheme({
  tokens: {
    colors: { primary: { '500': 'hsl(217 91% 60%)' } },
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

describe('ff resolver — fontFamily aliases', () => {
  it('ff="mono" → fontFamily: var(--font-family-mono)', () => {
    const result = parseStyleProps({ styleProps: { ff: 'mono' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontFamily).toBe('var(--font-family-mono)');
  });
  it('ff="heading" → fontFamily: var(--font-family-heading)', () => {
    const result = parseStyleProps({
      styleProps: { ff: 'heading' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.fontFamily).toBe('var(--font-family-heading)');
  });
  it('ff="serif" passes through', () => {
    const result = parseStyleProps({ styleProps: { ff: 'serif' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontFamily).toBe('serif');
  });
});

describe('bd resolver — border parsing + token resolution', () => {
  it('bd={1} → border: 0.0625rem', () => {
    const result = parseStyleProps({ styleProps: { bd: 1 }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.border).toBe('0.0625rem');
  });
  it('bd="1px solid primary.500" resolves to themed CSS var', () => {
    const result = parseStyleProps({
      styleProps: { bd: '1px solid primary.500' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.border).toBe('0.0625rem solid var(--color-primary-500)');
  });
  it('bd="2px dashed surface.raised" resolves semantic token', () => {
    const result = parseStyleProps({
      styleProps: { bd: '2px dashed surface.raised' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.border).toBe('0.125rem dashed var(--surface-raised)');
  });
  it('bd="none" passes through', () => {
    const result = parseStyleProps({ styleProps: { bd: 'none' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.border).toBe('none');
  });
});
