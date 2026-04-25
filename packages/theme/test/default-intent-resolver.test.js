import { describe, expect, it } from 'vitest';
import { defaultIntentResolver } from '../src/default-intent-resolver.ts';
const theme = {
    tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
    dark: {},
    semantic: {
        intent: ['primary', 'danger'],
        variant: ['filled', 'outline', 'subtle', 'ghost', 'link'],
        text: {},
        surface: {},
        border: {},
    },
    intentResolver: defaultIntentResolver,
    components: {},
    scope: ':root',
    darkMode: { selector: '.dark' },
    name: 'test',
};
describe('defaultIntentResolver', () => {
    describe('filled variant', () => {
        it('returns intent-500 background and inverted text', () => {
            const result = defaultIntentResolver({ intent: 'primary', variant: 'filled', theme });
            expect(result.background).toBe('var(--color-primary-500)');
            expect(result.color).toBe('var(--color-primary-foreground)');
            expect(result.border).toBe('transparent');
        });
        it('produces hover at intent-600', () => {
            const result = defaultIntentResolver({ intent: 'danger', variant: 'filled', theme });
            expect(result.hover).toBe('var(--color-danger-600)');
        });
    });
    describe('outline variant', () => {
        it('transparent background with intent-500 border', () => {
            const result = defaultIntentResolver({ intent: 'primary', variant: 'outline', theme });
            expect(result.background).toBe('transparent');
            expect(result.color).toBe('var(--color-primary-700)');
            expect(result.border).toBe('var(--color-primary-500)');
        });
    });
    describe('subtle variant', () => {
        it('uses intent-100 background', () => {
            const result = defaultIntentResolver({ intent: 'primary', variant: 'subtle', theme });
            expect(result.background).toBe('var(--color-primary-100)');
            expect(result.color).toBe('var(--color-primary-700)');
        });
    });
    describe('ghost variant', () => {
        it('transparent until hover, then intent-50 background', () => {
            const result = defaultIntentResolver({ intent: 'primary', variant: 'ghost', theme });
            expect(result.background).toBe('transparent');
            expect(result.hover).toBe('var(--color-primary-50)');
        });
    });
    describe('link variant', () => {
        it('uses intent-600 color, no background or border', () => {
            const result = defaultIntentResolver({ intent: 'primary', variant: 'link', theme });
            expect(result.background).toBe('transparent');
            expect(result.border).toBe('transparent');
            expect(result.color).toBe('var(--color-primary-600)');
        });
    });
    describe('unknown variant', () => {
        it('returns transparent neutral fallback', () => {
            const result = defaultIntentResolver({ intent: 'primary', variant: 'invalid', theme });
            expect(result.background).toBe('transparent');
            expect(result.color).toBe('inherit');
        });
    });
});
//# sourceMappingURL=default-intent-resolver.test.js.map