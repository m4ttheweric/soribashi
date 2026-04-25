import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Box } from '../src/Box/Box.tsx';
const theme = createTheme({
    tokens: {
        colors: {
            primary: { '500': 'hsl(217 91% 60%)' },
            neutral: { '0': '#fff', '100': '#eee' },
        },
        radius: { md: '0.5rem' },
        spacing: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem' },
        fontSize: { md: '1rem', lg: '1.125rem' },
        breakpoint: { xs: '24rem', sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' },
    },
});
const wrap = (ui) => render(_jsx(SoribashiProvider, { theme: theme, children: ui }));
describe('Box — basics', () => {
    it('renders div by default', () => {
        const { container } = wrap(_jsx(Box, { children: "X" }));
        expect(container.firstChild?.nodeName).toBe('DIV');
    });
    it('respects as prop for polymorphism', () => {
        const { container } = wrap(_jsx(Box, { as: "section", children: "X" }));
        expect(container.firstChild?.nodeName).toBe('SECTION');
    });
    it('forwards arbitrary HTML attributes (id, data-foo)', () => {
        const { container } = wrap(_jsx(Box, { id: "my-id", "data-foo": "bar", children: "X" }));
        const el = container.querySelector('#my-id');
        expect(el).toBeInTheDocument();
        expect(el.getAttribute('data-foo')).toBe('bar');
    });
    it('applies sb-Box-root class', () => {
        const { container } = wrap(_jsx(Box, { children: "X" }));
        expect(container.querySelector('div').className).toContain('sb-Box-root');
    });
});
describe('Box — style props', () => {
    it('p="md" produces inline padding with var() reference', () => {
        const { container } = wrap(_jsx(Box, { p: "md", children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.padding).toBe('var(--spacing-md)');
    });
    it('mt={16} produces inline marginTop in rem', () => {
        const { container } = wrap(_jsx(Box, { mt: 16, children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.marginTop).toBe('1rem');
    });
    it('mx="md" applies to both marginInlineStart and marginInlineEnd', () => {
        const { container } = wrap(_jsx(Box, { mx: "md", children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.marginInlineStart).toBe('var(--spacing-md)');
        expect(el.style.marginInlineEnd).toBe('var(--spacing-md)');
    });
    it('bg accepts theme color refs', () => {
        const { container } = wrap(_jsx(Box, { bg: "primary.500", children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.background).toBe('var(--color-primary-500)');
    });
    it('bg accepts surface refs', () => {
        const { container } = wrap(_jsx(Box, { bg: "surface.raised", children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.background).toBe('var(--surface-raised)');
    });
    it('bdrs="md" maps to borderRadius', () => {
        const { container } = wrap(_jsx(Box, { bdrs: "md", children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.borderRadius).toBe('var(--radius-md)');
    });
    it('w and h support number → rem', () => {
        const { container } = wrap(_jsx(Box, { w: 200, h: 100, children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.width).toBe('12.5rem');
        expect(el.style.height).toBe('6.25rem');
    });
    it('non-style props pass through unchanged', () => {
        const { container } = wrap(_jsx(Box, { p: "md", id: "x", role: "region", "aria-label": "hi", children: "X" }));
        const el = container.querySelector('div');
        expect(el.id).toBe('x');
        expect(el.getAttribute('role')).toBe('region');
        expect(el.getAttribute('aria-label')).toBe('hi');
    });
});
describe('Box — responsive style props', () => {
    it('responsive p emits an InlineStyles sibling with media queries', () => {
        const { container } = wrap(_jsx(Box, { p: { base: 'sm', md: 'lg' }, children: "X" }));
        const styleEl = container.querySelector('style');
        expect(styleEl).toBeInTheDocument();
        const text = styleEl?.textContent ?? '';
        expect(text).toContain('@media (min-width: 48rem)');
        expect(text).toContain('padding: var(--spacing-lg)');
    });
    it('responsive base applies as base styles in the InlineStyles block', () => {
        const { container } = wrap(_jsx(Box, { p: { base: 'sm', md: 'lg' }, children: "X" }));
        const text = container.querySelector('style')?.textContent ?? '';
        expect(text).toContain('padding: var(--spacing-sm)');
    });
    it('multiple responsive props share one InlineStyles block', () => {
        const { container } = wrap(_jsx(Box, { p: { base: 'sm', md: 'lg' }, bg: { base: 'surface.default', md: 'surface.raised' }, children: "X" }));
        const styles = container.querySelectorAll('style');
        expect(styles.length).toBe(1);
    });
    it('responsive className is appended alongside the static class', () => {
        const { container } = wrap(_jsx(Box, { p: { base: 'sm', md: 'lg' }, children: "X" }));
        const el = container.querySelector('div');
        expect(el.className).toContain('sb-Box-root');
        expect(el.className).toMatch(/sb-/);
    });
});
describe('Box — mod API', () => {
    it('mod object → data-* attributes', () => {
        const { container } = wrap(_jsx(Box, { mod: { active: true, loading: false }, children: "X" }));
        const el = container.querySelector('div');
        expect(el.dataset.active).toBe('true');
        expect(el.dataset.loading).toBeUndefined();
    });
    it('mod string → data-{key}: true', () => {
        const { container } = wrap(_jsx(Box, { mod: "open", children: "X" }));
        expect(container.querySelector('div').dataset.open).toBe('true');
    });
    it('mod array merges entries', () => {
        const { container } = wrap(_jsx(Box, { mod: [{ active: true }, 'open', { size: 'lg' }], children: "X" }));
        const el = container.querySelector('div');
        expect(el.dataset.active).toBe('true');
        expect(el.dataset.open).toBe('true');
        expect(el.dataset.size).toBe('lg');
    });
    it('variant prop becomes data-variant', () => {
        const { container } = wrap(_jsx(Box, { variant: "filled", children: "X" }));
        expect(container.querySelector('div').dataset.variant).toBe('filled');
    });
});
//# sourceMappingURL=Box.test.js.map