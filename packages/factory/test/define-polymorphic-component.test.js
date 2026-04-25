import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { definePolymorphicComponent } from '../src/define-polymorphic-component.tsx';
const Text = definePolymorphicComponent({
    name: 'Text',
    defaultElement: 'p',
    selectors: ['root'],
    classes: { root: 'sb-Text-root' },
    defaults: { size: 'md' },
    render: ({ Element, props, getStyles }) => {
        const { size, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props;
        return (_jsx(Element, { ...getStyles('root'), ...rest, "data-size": size, children: children }));
    },
});
const theme = createTheme({
    tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});
const wrap = (ui) => render(_jsx(SoribashiProvider, { theme: theme, children: ui }));
describe('definePolymorphicComponent', () => {
    it('renders the default element when as is not provided', () => {
        const { container } = wrap(_jsx(Text, { children: "Hello" }));
        expect(container.querySelector('p')).toBeInTheDocument();
        expect(container.querySelector('p')?.textContent).toBe('Hello');
    });
    it('renders the element specified via the as prop', () => {
        const { container } = wrap(_jsx(Text, { as: "span", children: "Hello" }));
        expect(container.querySelector('span')).toBeInTheDocument();
        expect(container.querySelector('p')).toBeNull();
    });
    it('renders a custom React component when as is a component', () => {
        const Link = ({ href, children, ...rest }) => (_jsx("a", { href: href, "data-testid": "link", ...rest, children: children }));
        const { container, getByTestId } = wrap(_jsx(Text, { as: Link, href: "/", children: "Click" }));
        expect(getByTestId('link')).toBeInTheDocument();
        expect(container.querySelector('a')?.getAttribute('href')).toBe('/');
    });
    it('applies built-in classes regardless of element', () => {
        const { container } = wrap(_jsx(Text, { as: "span", children: "X" }));
        expect(container.querySelector('span')?.className).toContain('sb-Text-root');
    });
    it('applies size default to data-size', () => {
        const { container } = wrap(_jsx(Text, { children: "X" }));
        expect(container.querySelector('p')?.dataset.size).toBe('md');
    });
    it('static methods (extend, withProps) exist', () => {
        expect(typeof Text.extend).toBe('function');
        expect(typeof Text.withProps).toBe('function');
    });
    it('Component.withProps preserves polymorphism', () => {
        // No `as any` cast on Text — this validates the typing fix:
        // withProps return type allows `as` at the call site.
        const SmallText = Text.withProps({ size: 'sm' });
        const { container } = wrap(_jsx(SmallText, { as: "span", children: "Y" }));
        expect(container.querySelector('span')?.dataset.size).toBe('sm');
    });
    it('Component.withProps with as preset overrides defaultElement', () => {
        // Presets including `as` change the default element of the resulting component.
        const SpanText = Text.withProps({ as: 'span' });
        const { container } = wrap(_jsx(SpanText, { children: "Z" }));
        expect(container.querySelector('span')).toBeInTheDocument();
        expect(container.querySelector('p')).toBeNull();
    });
});
//# sourceMappingURL=define-polymorphic-component.test.js.map