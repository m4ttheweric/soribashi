import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { useStyles } from '../src/hooks/use-styles.ts';
const wrapper = (themeOverride) => function Wrapper({ children }) {
    const theme = themeOverride ??
        createTheme({
            tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
        });
    return _jsx(SoribashiProvider, { theme: theme, children: children });
};
describe('useStyles', () => {
    it('returns getStyles function that resolves built-in class for selector', () => {
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
            props: {},
        }), { wrapper: wrapper() });
        expect(result.current('root').className).toContain('sb-Button-root');
        expect(result.current('label').className).toContain('sb-Button-label');
    });
    it('merges instance className into root selector', () => {
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
            className: 'my-extra-class',
            props: {},
        }), { wrapper: wrapper() });
        expect(result.current('root').className).toContain('sb-Button-root');
        expect(result.current('root').className).toContain('my-extra-class');
    });
    it('does NOT add instance className to non-root selectors', () => {
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
            className: 'my-extra-class',
            props: {},
        }), { wrapper: wrapper() });
        expect(result.current('label').className).not.toContain('my-extra-class');
    });
    it('applies instance classNames per selector', () => {
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
            classNames: { root: 'instance-root-extra', label: 'instance-label-extra' },
            props: {},
        }), { wrapper: wrapper() });
        expect(result.current('root').className).toContain('instance-root-extra');
        expect(result.current('label').className).toContain('instance-label-extra');
    });
    it('applies theme component classNames (object form)', () => {
        const themeWithClassNames = createTheme({
            tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
            components: {
                Button: { classNames: { root: 'theme-root-extra' } },
            },
        });
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root' },
            props: {},
        }), { wrapper: wrapper(themeWithClassNames) });
        expect(result.current('root').className).toContain('theme-root-extra');
    });
    it('applies theme component classNames (callback form, receives theme + props)', () => {
        const themeWithCallback = createTheme({
            tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
            components: {
                Button: {
                    classNames: ((_theme, props) => ({
                        root: props.size === 'lg' ? 'theme-root-lg' : 'theme-root-default',
                    })),
                },
            },
        });
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root' },
            props: { size: 'lg' },
        }), { wrapper: wrapper(themeWithCallback) });
        expect(result.current('root').className).toContain('theme-root-lg');
    });
    it('respects unstyled flag — drops built-in classes', () => {
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root', label: 'sb-Button-label' },
            unstyled: true,
            classNames: { root: 'instance-only' },
            props: {},
        }), { wrapper: wrapper() });
        expect(result.current('root').className).not.toContain('sb-Button-root');
        expect(result.current('root').className).toContain('instance-only');
    });
    it('emits data-variant when getStyles is called with variant option', () => {
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root' },
            props: { variant: 'filled' },
        }), { wrapper: wrapper() });
        const root = result.current('root', { variant: 'filled' });
        expect(root['data-variant']).toBe('filled');
    });
    it('emits data-active when active option is true', () => {
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root' },
            props: {},
        }), { wrapper: wrapper() });
        expect(result.current('root', { active: true })['data-active']).toBe(true);
        expect(result.current('root', { active: false })['data-active']).toBeUndefined();
    });
    it('merges instance attributes with per-selector attributes from theme', () => {
        const themeWithAttrs = createTheme({
            tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
            components: {
                Button: { attributes: { root: { 'data-testid': 'theme-button' } } },
            },
        });
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root' },
            attributes: { root: { 'data-testid': 'instance-button' } },
            props: {},
        }), { wrapper: wrapper(themeWithAttrs) });
        const root = result.current('root');
        expect(root['data-testid']).toBe('instance-button');
    });
    it('merges per-selector vars from varsResolver into style', () => {
        const { result } = renderHook(() => useStyles({
            name: 'Button',
            classes: { root: 'sb-Button-root' },
            props: { variant: 'filled' },
            varsResolver: () => ({
                root: { '--btn-bg': 'red' },
            }),
        }), { wrapper: wrapper() });
        const root = result.current('root');
        expect(root.style).toBeDefined();
        expect(root.style['--btn-bg']).toBe('red');
    });
});
//# sourceMappingURL=use-styles.test.js.map