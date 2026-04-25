import { describe, expect, it } from 'vitest';
import { rem, getSpacing, getRadius, getSize, getFontSize, getLineHeight, getShadow, getThemeColor, } from '../src/utils/index.ts';
describe('rem', () => {
    it('converts pixel numbers to rem', () => {
        expect(rem(16)).toBe('1rem');
        expect(rem(8)).toBe('0.5rem');
    });
    it('passes through strings', () => {
        expect(rem('1.5rem')).toBe('1.5rem');
        expect(rem('var(--x)')).toBe('var(--x)');
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
});
describe('getRadius', () => {
    it('returns var() for token keys including full', () => {
        expect(getRadius('md')).toBe('var(--radius-md)');
        expect(getRadius('full')).toBe('var(--radius-full)');
    });
    it('returns rem for numbers', () => {
        expect(getRadius(8)).toBe('0.5rem');
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
});
describe('getFontSize', () => {
    it('returns var(--font-size-{key})', () => {
        expect(getFontSize('lg')).toBe('var(--font-size-lg)');
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
//# sourceMappingURL=utils.test.js.map