import { describe, expect, it } from 'vitest';
import {
  rem,
  getSpacing,
  getRadius,
  getSize,
  getFontSize,
  getLineHeight,
  getShadow,
  getThemeColor,
} from '../src/utils/index.ts';

describe('rem', () => {
  it('converts pixel numbers to rem', () => {
    expect(rem(16)).toBe('1rem');
    expect(rem(8)).toBe('0.5rem');
  });
  it('converts zero', () => {
    expect(rem(0)).toBe('0rem');
  });
  it('passes through strings', () => {
    expect(rem('1.5rem')).toBe('1.5rem');
    expect(rem('var(--x)')).toBe('var(--x)');
    expect(rem('100%')).toBe('100%');
  });
  it('converts px strings to rem (#11)', () => {
    expect(rem('8px')).toBe('0.5rem');
    expect(rem('16px')).toBe('1rem');
  });
  it('recurses on space-separated px values (#11)', () => {
    expect(rem('16px 32px')).toBe('1rem 2rem');
  });
  it('passes through calc/clamp/var/rgba strings (#11)', () => {
    expect(rem('calc(100% - 16px)')).toBe('calc(100% - 16px)');
    expect(rem('var(--x)')).toBe('var(--x)');
    expect(rem('clamp(1rem, 5vw, 3rem)')).toBe('clamp(1rem, 5vw, 3rem)');
  });
  it('returns undefined for undefined', () => {
    expect(rem(undefined)).toBeUndefined();
  });
});

describe('getSpacing', () => {
  it('returns var() for token keys', () => {
    expect(getSpacing('md')).toBe('var(--spacing-md)');
    expect(getSpacing('xl')).toBe('var(--spacing-xl)');
  });
  it('returns rem for numbers', () => {
    expect(getSpacing(16)).toBe('1rem');
  });
  it('passes through other strings', () => {
    expect(getSpacing('1.25rem')).toBe('1.25rem');
    expect(getSpacing('calc(1rem + 2px)')).toBe('calc(1rem + 2px)');
  });
  it('returns undefined for undefined', () => {
    expect(getSpacing(undefined)).toBeUndefined();
  });
  // #10a: custom keys — not in KNOWN_KEYS but should still resolve
  it('resolves custom token keys to var() (#10a)', () => {
    expect(getSpacing('custom-key')).toBe('var(--spacing-custom-key)');
  });
  it('passes through raw CSS values with digits (#10a)', () => {
    expect(getSpacing('100px')).toBe('100px');
    expect(getSpacing('1.25rem')).toBe('1.25rem');
    expect(getSpacing('-4')).toBe('-4');
  });
  // 2xl starts with '2' — digit-leading string is treated as raw CSS per Mantine heuristic
  it('treats digit-leading strings as raw CSS (#10a edge case)', () => {
    // '2xl' starts with '2' → raw CSS pass-through, not a token
    expect(getSpacing('2xl')).toBe('2xl');
  });
});

describe('getRadius', () => {
  it('returns var() for token keys including full', () => {
    expect(getRadius('md')).toBe('var(--radius-md)');
    expect(getRadius('full')).toBe('var(--radius-full)');
  });
  it('returns rem for numbers', () => {
    expect(getRadius(8)).toBe('0.5rem');
  });
  // #10b: undefined → var(--radius-md) fallback
  it('falls back to var(--radius-md) for undefined (#10b)', () => {
    expect(getRadius(undefined)).toBe('var(--radius-md)');
  });
  // #10a: custom keys
  it('resolves custom token keys to var() (#10a)', () => {
    expect(getRadius('custom-key')).toBe('var(--radius-custom-key)');
  });
  it('passes through raw CSS values with digits (#10a)', () => {
    expect(getRadius('100px')).toBe('100px');
  });
});

describe('getSize', () => {
  it('parameterizes the prefix', () => {
    expect(getSize('md', 'container-size')).toBe('var(--container-size-md)');
    expect(getSize('lg', 'sg')).toBe('var(--sg-lg)');
  });
  it('returns rem for numbers regardless of prefix', () => {
    expect(getSize(20, 'whatever')).toBe('1.25rem');
  });
  // #10a: custom keys not in STANDARD_KEYS
  it('resolves custom token keys to var() (#10a)', () => {
    expect(getSize('custom-key', 'foo')).toBe('var(--foo-custom-key)');
    expect(getSize('2xl', 'foo')).toBe('2xl'); // digit-leading → raw CSS
  });
  it('passes through raw CSS values (#10a)', () => {
    expect(getSize('100px', 'foo')).toBe('100px');
    expect(getSize('var(--x)', 'foo')).toBe('var(--x)');
    expect(getSize('calc(100% - 8px)', 'foo')).toBe('calc(100% - 8px)');
  });
  it('returns undefined for undefined', () => {
    expect(getSize(undefined, 'foo')).toBeUndefined();
  });
});

describe('getFontSize', () => {
  it('returns var(--font-size-{key})', () => {
    expect(getFontSize('lg')).toBe('var(--font-size-lg)');
  });
  // #10a: custom keys
  it('resolves custom token keys to var() (#10a)', () => {
    expect(getFontSize('custom-key')).toBe('var(--font-size-custom-key)');
  });
  it('passes through raw CSS values (#10a)', () => {
    expect(getFontSize('100px')).toBe('100px');
    expect(getFontSize('2rem')).toBe('2rem');
  });
  it('returns undefined for undefined', () => {
    expect(getFontSize(undefined)).toBeUndefined();
  });
});

describe('getLineHeight', () => {
  it('returns var(--line-height-{key}) for known keys', () => {
    expect(getLineHeight('md')).toBe('var(--line-height-md)');
  });
  it('passes through numbers as-is (line-height is unitless)', () => {
    expect(getLineHeight(1.5)).toBe('1.5');
  });
});

describe('getShadow', () => {
  it('returns var() for known keys', () => {
    expect(getShadow('md')).toBe('var(--shadow-md)');
  });
  it('passes through other strings', () => {
    expect(getShadow('0 1px 2px black')).toBe('0 1px 2px black');
  });
});

describe('getThemeColor', () => {
  it('resolves family.shade to var(--color-{family}-{shade})', () => {
    expect(getThemeColor('primary.500')).toBe('var(--color-primary-500)');
    expect(getThemeColor('danger.700')).toBe('var(--color-danger-700)');
  });

  it('resolves bare color name to default shade 500', () => {
    expect(getThemeColor('primary')).toBe('var(--color-primary-500)');
  });

  it('resolves semantic surface/text/border refs', () => {
    expect(getThemeColor('surface.raised')).toBe('var(--surface-raised)');
    expect(getThemeColor('text.muted')).toBe('var(--text-muted)');
    expect(getThemeColor('border.strong')).toBe('var(--border-strong)');
  });

  it('passes through CSS keywords', () => {
    expect(getThemeColor('transparent')).toBe('transparent');
    expect(getThemeColor('inherit')).toBe('inherit');
    expect(getThemeColor('currentColor')).toBe('currentColor');
  });

  it('passes through CSS color values', () => {
    expect(getThemeColor('#fff')).toBe('#fff');
    expect(getThemeColor('rgb(0 0 0)')).toBe('rgb(0 0 0)');
    expect(getThemeColor('var(--my-color)')).toBe('var(--my-color)');
  });

  it('returns undefined for undefined', () => {
    expect(getThemeColor(undefined)).toBeUndefined();
  });
});
