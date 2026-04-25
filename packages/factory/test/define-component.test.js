import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineComponent } from '../src/define-component.tsx';
const Button = defineComponent({
    name: 'Button',
    selectors: ['root', 'label', 'icon'],
    classes: { root: 'sb-Button-root', label: 'sb-Button-label', icon: 'sb-Button-icon' },
    defaults: { loading: false, fullWidth: false },
    render: ({ props, getStyles }) => (_jsxs("button", { ...getStyles('root'), children: [props.leftIcon && _jsx("span", { ...getStyles('icon'), children: props.leftIcon }), _jsx("span", { ...getStyles('label'), children: props.children })] })),
});
const theme = createTheme({
    tokens: {
        colors: {
            primary: { '500': 'hsl(217 91% 60%)', foreground: 'white' },
        },
        radius: {},
        spacing: {},
        fontSize: {},
    },
});
const wrap = (ui) => render(_jsx(SoribashiProvider, { theme: theme, children: ui }));
describe('defineComponent — basic rendering', () => {
    it('renders the root with the configured class', () => {
        const { container } = wrap(_jsx(Button, { children: "Click" }));
        expect(container.querySelector('button')?.className).toContain('sb-Button-root');
    });
    it('passes children through to label slot', () => {
        const { getByText } = wrap(_jsx(Button, { children: "Hello" }));
        expect(getByText('Hello')).toBeInTheDocument();
    });
    it('renders leftIcon when provided', () => {
        const { container } = wrap(_jsx(Button, { leftIcon: _jsx("span", { "data-testid": "icon", children: "\u2605" }), children: "X" }));
        expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument();
    });
    it('respects instance className on root', () => {
        const { container } = wrap(_jsx(Button, { className: "my-class", children: "X" }));
        expect(container.querySelector('button')?.className).toContain('my-class');
    });
});
describe('defineComponent — withProps', () => {
    it('Component.withProps returns a component with presets', () => {
        const LoadingButton = Button.withProps({ loading: true });
        const { container } = wrap(_jsx(LoadingButton, { children: "X" }));
        expect(container.querySelector('button')).toBeInTheDocument();
    });
});
describe('defineComponent — extend (theme defaults)', () => {
    it('theme component classNames are applied to root', () => {
        const themed = createTheme({
            tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
            components: {
                Button: { classNames: { root: 'theme-extra' } },
            },
        });
        const { container } = render(_jsx(SoribashiProvider, { theme: themed, children: _jsx(Button, { children: "X" }) }));
        expect(container.querySelector('button')?.className).toContain('theme-extra');
    });
    it('Component.classes is exposed', () => {
        expect(Button.classes).toBeDefined();
        expect(Button.classes?.root).toBe('sb-Button-root');
    });
    it('Component.displayName matches name', () => {
        expect(Button.displayName).toBe('Button');
    });
});
//# sourceMappingURL=define-component.test.js.map