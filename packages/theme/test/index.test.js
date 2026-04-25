import { describe, expect, it } from 'vitest';
import { createTheme, defaultIntentResolver, defaultTokens, defaultDarkTokens, } from '../src/index.ts';
describe('@soribashi/theme public API', () => {
    it('exports createTheme as a function', () => {
        expect(typeof createTheme).toBe('function');
    });
    it('exports defaultIntentResolver as a function', () => {
        expect(typeof defaultIntentResolver).toBe('function');
    });
    it('exports defaultTokens with colors', () => {
        expect(defaultTokens.colors.primary).toBeDefined();
    });
    it('exports defaultDarkTokens', () => {
        expect(defaultDarkTokens.colors).toBeDefined();
    });
    it('types compile and ResolvedTheme matches createTheme return', () => {
        const def = {
            tokens: {
                colors: { primary: { '500': '#000' } },
                radius: { md: '0.5rem' },
                spacing: { md: '0.5rem' },
                fontSize: { md: '1rem' },
            },
        };
        const theme = createTheme(def);
        const resolver = theme.intentResolver;
        expect(typeof resolver).toBe('function');
    });
});
//# sourceMappingURL=index.test.js.map