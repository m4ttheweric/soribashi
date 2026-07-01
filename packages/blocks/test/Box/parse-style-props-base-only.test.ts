import { createTheme } from '@soribashi/theme';
/**
 * TDD regression test for BUG PSP-B1:
 *   parseStyleProps treats { base: 'md' } (only-base responsive object) as
 *   hasResponsiveStyles=true, unnecessarily generating an <InlineStyles> block.
 *
 * Mantine source:
 *   packages/@mantine/core/src/core/Box/style-props/parse-style-props/parse-style-props.ts
 *   (commit 63dafbbf) — hasResponsiveStyles() returns false when the only key is 'base'.
 *
 * After the fix, { base: value } is treated identically to the flat value:
 *   - hasResponsiveStyles is false
 *   - the resolved value lands in inlineStyles (not styles)
 *   - no <style> element is generated
 */
import { describe, expect, it } from 'vitest';
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

const parse = (styleProps: Record<string, unknown>) =>
  parseStyleProps({ styleProps, data: STYLE_PROPS_DATA, theme });

describe('parseStyleProps — base-only value treated as non-responsive (PSP-B1)', () => {
  it('PSP-B1a: { base: "md" } hasResponsiveStyles is false (Mantine parity)', () => {
    const result = parse({ p: { base: 'md' } });
    expect(result.hasResponsiveStyles).toBe(false);
  });

  it('PSP-B1b: { base: "md" } value lands in inlineStyles (not styles)', () => {
    const result = parse({ p: { base: 'md' } });
    expect(result.inlineStyles.padding).toBe('var(--spacing-md)');
    expect(result.styles.padding).toBeUndefined();
  });

  it('PSP-B1c: { base: "md" } produces same result as flat "md"', () => {
    const flat = parse({ p: 'md' });
    const baseOnly = parse({ p: { base: 'md' } });
    expect(baseOnly.inlineStyles).toEqual(flat.inlineStyles);
    expect(baseOnly.hasResponsiveStyles).toBe(flat.hasResponsiveStyles);
    expect(baseOnly.styles).toEqual(flat.styles);
  });

  it('PSP-B1d: { base: "md", sm: "lg" } is still responsive (has real breakpoint)', () => {
    const result = parse({ p: { base: 'md', sm: 'lg' } });
    expect(result.hasResponsiveStyles).toBe(true);
    expect(result.styles.padding).toBe('var(--spacing-md)');
    expect(result.media['(min-width: 40rem)']?.padding).toBe('var(--spacing-lg)');
  });

  it('PSP-B1e: { sm: "lg" } without base is still responsive', () => {
    const result = parse({ p: { sm: 'lg' } });
    expect(result.hasResponsiveStyles).toBe(true);
    expect(result.styles.padding).toBeUndefined();
    expect(result.media['(min-width: 40rem)']?.padding).toBe('var(--spacing-lg)');
  });
});
