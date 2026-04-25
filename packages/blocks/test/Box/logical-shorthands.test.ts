import { describe, expect, it } from 'vitest';
import { createTheme } from '@soribashi/theme';
import { parseStyleProps } from '../../src/Box/style-props/parse-style-props.ts';
import { STYLE_PROPS_DATA } from '../../src/Box/style-props/style-props-data.ts';

const theme = createTheme({
  tokens: {
    colors: {},
    radius: {},
    spacing: { md: '0.75rem', lg: '1rem' },
    fontSize: {},
    breakpoint: { xs: '24rem', sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' },
  },
});

describe('mx/my logical shorthands', () => {
  it('my="md" → marginBlock (not separate top/bottom)', () => {
    const result = parseStyleProps({ styleProps: { my: 'md' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.marginBlock).toBe('var(--spacing-md)');
    expect(result.inlineStyles.marginTop).toBeUndefined();
    expect(result.inlineStyles.marginBottom).toBeUndefined();
  });

  it('mx="md" → marginInline (not separate start/end)', () => {
    const result = parseStyleProps({ styleProps: { mx: 'md' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.marginInline).toBe('var(--spacing-md)');
    expect(result.inlineStyles.marginInlineStart).toBeUndefined();
    expect(result.inlineStyles.marginInlineEnd).toBeUndefined();
  });

  it('py="md" → paddingBlock (not separate top/bottom)', () => {
    const result = parseStyleProps({ styleProps: { py: 'md' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.paddingBlock).toBe('var(--spacing-md)');
    expect(result.inlineStyles.paddingTop).toBeUndefined();
    expect(result.inlineStyles.paddingBottom).toBeUndefined();
  });

  it('px="md" → paddingInline (not separate start/end)', () => {
    const result = parseStyleProps({ styleProps: { px: 'md' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.paddingInline).toBe('var(--spacing-md)');
    expect(result.inlineStyles.paddingInlineStart).toBeUndefined();
    expect(result.inlineStyles.paddingInlineEnd).toBeUndefined();
  });
});
