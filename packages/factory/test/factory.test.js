import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { factory } from '../src/factory.tsx';
const Button = factory((props) => (_jsx("button", { "data-size": props.size, children: props.children })));
Button.displayName = 'Button';
describe('factory', () => {
    it('returns a renderable component', () => {
        const { getByText } = render(_jsx(Button, { children: "Click" }));
        expect(getByText('Click')).toBeInTheDocument();
    });
    it('attaches extend as identity', () => {
        expect(typeof Button.extend).toBe('function');
        const config = { defaultProps: { size: 'lg' } };
        expect(Button.extend(config)).toBe(config);
    });
    it('attaches withProps that returns a component preset', () => {
        const LargeButton = Button.withProps({ size: 'lg' });
        const { container } = render(_jsx(LargeButton, { children: "X" }));
        expect(container.querySelector('button')?.dataset.size).toBe('lg');
    });
    it('withProps: instance props override preset', () => {
        const LargeButton = Button.withProps({ size: 'lg' });
        const { container } = render(_jsx(LargeButton, { size: "sm", children: "X" }));
        expect(container.querySelector('button')?.dataset.size).toBe('sm');
    });
    it('preserves displayName on withProps result', () => {
        const LargeButton = Button.withProps({ size: 'lg' });
        expect(LargeButton.displayName).toContain('Button');
    });
});
//# sourceMappingURL=factory.test.js.map