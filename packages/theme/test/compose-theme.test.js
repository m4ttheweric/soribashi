import { describe, expect, it } from 'vitest';
import { createTheme } from '../src/create-theme.ts';
describe('theme composition (extends)', () => {
    it('extending a theme inherits base tokens', () => {
        const base = createTheme({
            tokens: {
                colors: { primary: { '500': '#aaa' } },
                radius: { md: '0.5rem' },
                spacing: { md: '0.5rem' },
                fontSize: { md: '1rem' },
            },
            name: 'base',
        });
        const child = createTheme({
            extends: base,
            tokens: {
                colors: { brand: { '500': '#fff' } },
                radius: {},
                spacing: {},
                fontSize: {},
            },
            name: 'child',
        });
        expect(child.tokens.colors.primary?.['500']).toBe('#aaa');
        expect(child.tokens.colors.brand?.['500']).toBe('#fff');
        expect(child.name).toBe('child');
    });
    it('child tokens override base tokens by key', () => {
        const base = createTheme({
            tokens: {
                colors: { primary: { '500': '#aaa' } },
                radius: { md: '0.5rem' },
                spacing: { md: '0.5rem' },
                fontSize: { md: '1rem' },
            },
        });
        const child = createTheme({
            extends: base,
            tokens: {
                colors: { primary: { '500': '#bbb' } },
                radius: {},
                spacing: {},
                fontSize: {},
            },
        });
        expect(child.tokens.colors.primary?.['500']).toBe('#bbb');
    });
    it('child semantic overrides base semantic per-key', () => {
        const base = createTheme({
            tokens: {
                colors: { primary: { '500': '#aaa' } },
                radius: { md: '0.5rem' },
                spacing: { md: '0.5rem' },
                fontSize: { md: '1rem' },
            },
            semantic: {
                text: { muted: 'colors.primary.500' },
            },
        });
        const child = createTheme({
            extends: base,
            tokens: {
                colors: {},
                radius: {},
                spacing: {},
                fontSize: {},
            },
            semantic: {
                text: { default: 'colors.primary.500' },
            },
        });
        expect(child.semantic.text.muted).toBe('colors.primary.500');
        expect(child.semantic.text.default).toBe('colors.primary.500');
    });
    it('child scope and darkMode override base', () => {
        const base = createTheme({
            tokens: {
                colors: { primary: { '500': '#aaa' } },
                radius: { md: '0.5rem' },
                spacing: { md: '0.5rem' },
                fontSize: { md: '1rem' },
            },
            scope: ':root',
            darkMode: { selector: '.dark' },
        });
        const child = createTheme({
            extends: base,
            tokens: {
                colors: {},
                radius: {},
                spacing: {},
                fontSize: {},
            },
            scope: '.tenant-foo',
            darkMode: { selector: '.dark .tenant-foo' },
        });
        expect(child.scope).toBe('.tenant-foo');
        expect(child.darkMode.selector).toBe('.dark .tenant-foo');
    });
    it('child component config replaces base component config', () => {
        const base = createTheme({
            tokens: {
                colors: { primary: { '500': '#aaa' } },
                radius: { md: '0.5rem' },
                spacing: { md: '0.5rem' },
                fontSize: { md: '1rem' },
            },
            components: {
                Button: { defaultProps: { size: 'md' } },
            },
        });
        const child = createTheme({
            extends: base,
            tokens: {
                colors: {},
                radius: {},
                spacing: {},
                fontSize: {},
            },
            components: {
                Button: { defaultProps: { size: 'lg' } },
            },
        });
        expect(child.components.Button?.defaultProps).toEqual({ size: 'lg' });
    });
});
//# sourceMappingURL=compose-theme.test.js.map