import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineComponent } from '../src/define-component.tsx';
const Button = defineComponent({
    name: 'Button',
    selectors: ['root'],
    variants: ['filled', 'outline'],
    classes: { root: 'sb-Button-root' },
    defaults: { intent: 'primary', variant: 'filled' },
    render: ({ props, getStyles }) => (_jsx("button", { ...getStyles('root'), children: props.children })),
});
const theme = createTheme({
    tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});
describe('defineComponent — intent → CSS vars on root', () => {
    it('produces --button-bg, --button-color, --button-border on root style', () => {
        const { container } = render(_jsx(SoribashiProvider, { theme: theme, children: _jsx(Button, { intent: "primary", variant: "filled", children: "X" }) }));
        const btn = container.querySelector('button');
        const style = btn.style;
        expect(style.getPropertyValue('--button-bg')).toBe('var(--color-primary-500)');
        expect(style.getPropertyValue('--button-color')).toBe('var(--color-primary-foreground)');
        expect(style.getPropertyValue('--button-border')).toBe('transparent');
    });
    it('outline variant produces transparent bg and intent-700 color', () => {
        const { container } = render(_jsx(SoribashiProvider, { theme: theme, children: _jsx(Button, { intent: "danger", variant: "outline", children: "X" }) }));
        const btn = container.querySelector('button');
        const style = btn.style;
        expect(style.getPropertyValue('--button-bg')).toBe('transparent');
        expect(style.getPropertyValue('--button-color')).toBe('var(--color-danger-700)');
        expect(style.getPropertyValue('--button-border')).toBe('var(--color-danger-500)');
    });
    it('does not produce vars when component has no variants declared', () => {
        const Paper = defineComponent({
            name: 'Paper',
            selectors: ['root'],
            classes: { root: 'sb-Paper-root' },
            defaults: { shadow: 'sm' },
            render: ({ props, getStyles }) => _jsx("div", { ...getStyles('root'), children: props.children }),
        });
        const { container } = render(_jsx(SoribashiProvider, { theme: theme, children: _jsx(Paper, { children: "X" }) }));
        const div = container.querySelector('div');
        expect(div.style.getPropertyValue('--paper-bg')).toBe('');
    });
    it('explicit vars resolver in defineComponent overrides auto-vars', () => {
        const Badge = defineComponent({
            name: 'Badge',
            selectors: ['root'],
            variants: ['filled'],
            classes: { root: 'sb-Badge-root' },
            defaults: { intent: 'primary', variant: 'filled' },
            vars: () => ({
                root: { '--badge-bg': 'magenta' },
            }),
            render: ({ getStyles }) => _jsx("span", { ...getStyles('root'), children: "X" }),
        });
        const { container } = render(_jsx(SoribashiProvider, { theme: theme, children: _jsx(Badge, { children: "X" }) }));
        const span = container.querySelector('span');
        expect(span.style.getPropertyValue('--badge-bg')).toBe('magenta');
    });
});
//# sourceMappingURL=define-component.intent.test.js.map