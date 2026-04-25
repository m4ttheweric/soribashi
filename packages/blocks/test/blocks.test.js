import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '@soribashi/factory';
import { Box, Stack, Group, Flex, Grid, SimpleGrid, Container, Center, AspectRatio, Space, Paper, Text, Title, } from '../src/index.ts';
const theme = createTheme({
    tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});
const wrap = (ui) => render(_jsx(SoribashiProvider, { theme: theme, children: ui }));
describe('Box (smoke — full coverage in test/Box.test.tsx)', () => {
    it('renders div by default', () => {
        const { container } = wrap(_jsx(Box, { children: "X" }));
        expect(container.querySelector('div')).toBeInTheDocument();
        expect(container.querySelector('div').className).toContain('sb-Box-root');
    });
    it('respects as prop', () => {
        const { container } = wrap(_jsx(Box, { as: "section", children: "X" }));
        expect(container.querySelector('section')).toBeInTheDocument();
    });
    it('forwards arbitrary HTML attributes', () => {
        const { container } = wrap(_jsx(Box, { id: "test", "data-foo": "bar", children: "X" }));
        const el = container.querySelector('#test');
        expect(el).toBeInTheDocument();
        expect(el.getAttribute('data-foo')).toBe('bar');
    });
    it('style props produce inline styles (new Mantine-faithful behavior)', () => {
        const { container } = wrap(_jsx(Box, { p: "md", bdrs: "lg", bg: "surface.raised", children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.padding).toBe('var(--spacing-md)');
        expect(el.style.borderRadius).toBe('var(--radius-lg)');
        expect(el.style.background).toBe('var(--surface-raised)');
    });
});
describe('Stack', () => {
    it('renders with default md gap (CSS var on style)', () => {
        const { container } = wrap(_jsx(Stack, { children: "X" }));
        const el = container.querySelector('div');
        expect(el.className).toContain('sb-Stack-root');
        expect(el.style.getPropertyValue('--stack-gap')).toBe('var(--spacing-md)');
    });
    it('applies gap, align, justify as CSS vars', () => {
        const { container } = wrap(_jsx(Stack, { gap: "lg", align: "center", justify: "space-between", children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.getPropertyValue('--stack-gap')).toBe('var(--spacing-lg)');
        expect(el.style.getPropertyValue('--stack-align')).toBe('center');
        expect(el.style.getPropertyValue('--stack-justify')).toBe('space-between');
    });
    it('Stack accepts raw CSS values for gap', () => {
        const { container } = wrap(_jsx(Stack, { gap: "2.5rem", children: "X" }));
        const el = container.querySelector('div');
        expect(el.style.getPropertyValue('--stack-gap')).toBe('2.5rem');
    });
});
describe('Group', () => {
    it('renders with default md gap and wrap', () => {
        const { container } = wrap(_jsx(Group, { children: "X" }));
        const el = container.firstChild;
        expect(el.dataset.gap).toBe('md');
        expect(el.dataset.wrap).toBe('wrap');
    });
    it('applies wrap=nowrap', () => {
        const { container } = wrap(_jsx(Group, { wrap: "nowrap", children: "X" }));
        expect(container.firstChild.dataset.wrap).toBe('nowrap');
    });
});
describe('Flex', () => {
    it('renders with default direction=row', () => {
        const { container } = wrap(_jsx(Flex, { children: "X" }));
        expect(container.firstChild.dataset.direction).toBe('row');
    });
    it('respects direction=column', () => {
        const { container } = wrap(_jsx(Flex, { direction: "column", children: "X" }));
        expect(container.firstChild.dataset.direction).toBe('column');
    });
});
describe('Grid', () => {
    it('renders 12 columns by default', () => {
        const { container } = wrap(_jsx(Grid, { children: "X" }));
        expect(container.firstChild.dataset.columns).toBe('12');
    });
    it('Grid.Col is a compound component', () => {
        expect(Grid.Col).toBeDefined();
    });
    it('Grid.Col applies span', () => {
        const { container } = wrap(_jsx(Grid.Col, { span: 6, children: "X" }));
        expect(container.firstChild.dataset.span).toBe('6');
    });
});
describe('SimpleGrid', () => {
    it('renders 2 cols by default', () => {
        const { container } = wrap(_jsx(SimpleGrid, { children: "X" }));
        expect(container.firstChild.dataset.cols).toBe('2');
    });
});
describe('Container', () => {
    it('renders lg size by default', () => {
        const { container } = wrap(_jsx(Container, { children: "X" }));
        expect(container.firstChild.dataset.size).toBe('lg');
    });
    it('respects size prop', () => {
        const { container } = wrap(_jsx(Container, { size: "xl", children: "X" }));
        expect(container.firstChild.dataset.size).toBe('xl');
    });
});
describe('Center', () => {
    it('renders with inline=false default', () => {
        const { container } = wrap(_jsx(Center, { children: "X" }));
        expect(container.firstChild.dataset.inline).toBe('false');
    });
    it('respects inline prop', () => {
        const { container } = wrap(_jsx(Center, { inline: true, children: "X" }));
        expect(container.firstChild.dataset.inline).toBe('true');
    });
});
describe('AspectRatio', () => {
    it('renders with default 16/9 ratio', () => {
        const { container } = wrap(_jsx(AspectRatio, { children: "X" }));
        const el = container.firstChild;
        expect(el.style.aspectRatio).toBe(String(16 / 9));
    });
    it('respects custom ratio', () => {
        const { container } = wrap(_jsx(AspectRatio, { ratio: 2, children: "X" }));
        expect(container.firstChild.style.aspectRatio).toBe('2');
    });
});
describe('Space', () => {
    it('renders empty div with h prop', () => {
        const { container } = wrap(_jsx(Space, { h: "md" }));
        const el = container.firstChild;
        expect(el.nodeName).toBe('DIV');
        expect(el.dataset.h).toBe('md');
    });
});
describe('Paper', () => {
    it('renders with default shadow=sm radius=md p=md', () => {
        const { container } = wrap(_jsx(Paper, { children: "X" }));
        const el = container.firstChild;
        expect(el.dataset.shadow).toBe('sm');
        expect(el.dataset.radius).toBe('md');
        expect(el.dataset.p).toBe('md');
    });
    it('respects withBorder', () => {
        const { container } = wrap(_jsx(Paper, { withBorder: true, children: "X" }));
        expect(container.firstChild.dataset.withBorder).toBe('true');
    });
});
describe('Text', () => {
    it('renders p by default', () => {
        const { container } = wrap(_jsx(Text, { children: "X" }));
        expect(container.firstChild?.nodeName).toBe('P');
    });
    it('respects as prop', () => {
        const { container } = wrap(_jsx(Text, { as: "span", children: "X" }));
        expect(container.firstChild?.nodeName).toBe('SPAN');
    });
    it('applies size and color', () => {
        const { container } = wrap(_jsx(Text, { size: "lg", color: "muted", children: "X" }));
        const el = container.firstChild;
        expect(el.dataset.size).toBe('lg');
        expect(el.dataset.color).toBe('muted');
    });
});
describe('Title', () => {
    it('renders h1 by default', () => {
        const { container } = wrap(_jsx(Title, { children: "X" }));
        expect(container.firstChild?.nodeName).toBe('H1');
    });
    it('renders correct heading element per level', () => {
        for (const level of [1, 2, 3, 4, 5, 6]) {
            const { container } = wrap(_jsx(Title, { level: level, children: "X" }));
            expect(container.firstChild?.nodeName).toBe(`H${level}`);
        }
    });
});
//# sourceMappingURL=blocks.test.js.map