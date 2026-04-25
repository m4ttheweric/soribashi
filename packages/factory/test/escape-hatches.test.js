import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { polymorphicComponent } from '../src/polymorphic-component.tsx';
import { genericComponent } from '../src/generic-component.tsx';
describe('lower-level escape hatches', () => {
    it('polymorphicComponent renders and exposes withProps', () => {
        const Box = polymorphicComponent(({ as: As = 'div', children }) => (_jsx(As, { "data-test": "poly", children: children })));
        const { container } = render(_jsx(Box, { children: "X" }));
        expect(container.querySelector('div[data-test="poly"]')).toBeInTheDocument();
        expect(typeof Box.withProps).toBe('function');
    });
    it('genericComponent renders and exposes withProps', () => {
        const Comp = genericComponent(({ value }) => _jsx("span", { children: value }));
        const { container } = render(_jsx(Comp, { value: "hi" }));
        expect(container.textContent).toBe('hi');
        expect(typeof Comp.withProps).toBe('function');
    });
});
//# sourceMappingURL=escape-hatches.test.js.map