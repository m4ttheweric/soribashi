import { describe, expect, it } from 'vitest';
import { parseStyleProps } from '../../../src/factory/style-props/parse-style-props.ts';
import { STYLE_PROPS_DATA } from '../../../src/factory/style-props/style-props-data.ts';
import { getFontWeight } from '../../../src/factory/style-props/theme-resolvers/index.ts';
import { createTheme } from '../../../src/theme/index.ts';

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {}, breakpoint: {} },
});

/**
 * fw resolves theme font-weight tokens like its siblings (fz/lh/spacing):
 * open-ended token resolution via the shared raw-vs-token heuristic, with
 * genuine CSS font-weight values passing through untouched. Numbers stay
 * unitless (no rem conversion) — same posture as getLineHeight.
 */
describe('fw resolver — theme font-weight tokens', () => {
  it('fw resolves a theme font-weight token key to its custom property', () => {
    const result = parseStyleProps({ styleProps: { fw: 'bold' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontWeight).toBe('var(--font-weight-bold)');
  });

  it('fw resolves any non-raw token key open-endedly (semibold, custom keys)', () => {
    const result = parseStyleProps({
      styleProps: { fw: 'semibold' },
      data: STYLE_PROPS_DATA,
      theme,
    });
    expect(result.inlineStyles.fontWeight).toBe('var(--font-weight-semibold)');
  });

  it('fw passes a numeric value through unitless', () => {
    const result = parseStyleProps({ styleProps: { fw: 600 }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontWeight).toBe('600');
  });

  it('fw passes digit-leading strings through untouched', () => {
    const result = parseStyleProps({ styleProps: { fw: '700' }, data: STYLE_PROPS_DATA, theme });
    expect(result.inlineStyles.fontWeight).toBe('700');
  });

  it('fw passes relative and normal font-weight keywords through untouched', () => {
    for (const keyword of ['bolder', 'lighter', 'normal']) {
      const result = parseStyleProps({
        styleProps: { fw: keyword },
        data: STYLE_PROPS_DATA,
        theme,
      });
      expect(result.inlineStyles.fontWeight).toBe(keyword);
    }
  });

  it('fw passes CSS-wide keywords and var()/calc() expressions through untouched', () => {
    for (const value of ['inherit', 'initial', 'unset', 'var(--font-weight-semibold)']) {
      const result = parseStyleProps({ styleProps: { fw: value }, data: STYLE_PROPS_DATA, theme });
      expect(result.inlineStyles.fontWeight).toBe(value);
    }
  });

  it('getFontWeight returns undefined for undefined input', () => {
    expect(getFontWeight(undefined)).toBeUndefined();
  });
});
