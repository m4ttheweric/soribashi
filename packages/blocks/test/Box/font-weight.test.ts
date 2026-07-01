import { createTheme } from '@soribashi/theme';
import { describe, expect, it } from 'vitest';
import { parseStyleProps } from '../../src/Box/style-props/parse-style-props.ts';
import { STYLE_PROPS_DATA } from '../../src/Box/style-props/style-props-data.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {}, breakpoint: {} },
});

describe('fw resolver — identity pass-through (Mantine parity)', () => {
  it('fw="bolder" → font-weight: bolder (CSS keyword, not var())', () => {
    const result = parseStyleProps({ styleProps: { fw: 'bolder' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontWeight).toBe('bolder');
  });

  it('fw="lighter" → font-weight: lighter (CSS keyword)', () => {
    const result = parseStyleProps({
      styleProps: { fw: 'lighter' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.fontWeight).toBe('lighter');
  });

  it('fw={700} → font-weight: 700 (numeric, passed through as string)', () => {
    const result = parseStyleProps({ styleProps: { fw: 700 }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontWeight).toBe('700');
  });

  it('fw="bold" → font-weight: bold (NOT var(--font-weight-bold))', () => {
    const result = parseStyleProps({ styleProps: { fw: 'bold' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontWeight).toBe('bold');
    expect(result.inlineStyles.fontWeight).not.toContain('var(');
  });
});
