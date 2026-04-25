import { jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineGenericComponent } from '../src/define-generic-component.tsx';
const Select = defineGenericComponent({
    name: 'Select',
    selectors: ['root', 'option'],
    classes: { root: 'sb-Select-root', option: 'sb-Select-option' },
    defaults: {},
    render: ({ props, getStyles }) => (_jsx("ul", { ...getStyles('root'), "data-testid": "select", children: props.items.map((item) => {
            const key = props.getKey(item);
            const isSelected = props.value && props.getKey(props.value) === key;
            return (_jsx("li", { ...getStyles('option'), "data-selected": isSelected, onClick: () => props.onChange(item), children: props.renderItem ? props.renderItem(item) : key }, key));
        }) })),
});
const theme = createTheme({
    tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});
const wrap = (ui) => render(_jsx(SoribashiProvider, { theme: theme, children: ui }));
describe('defineGenericComponent', () => {
    it('renders items and applies classes', () => {
        const users = [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
        ];
        const { container } = wrap(_jsx(Select, { items: users, value: null, onChange: () => { }, getKey: (u) => u.id, renderItem: (u) => u.name }));
        expect(container.querySelector('ul')?.className).toContain('sb-Select-root');
        expect(container.querySelectorAll('li').length).toBe(2);
        expect(container.querySelectorAll('li')[0]?.textContent).toBe('Alice');
    });
    it('onChange receives the typed item', () => {
        const users = [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
        ];
        let captured = null;
        const { container } = wrap(_jsx(Select, { items: users, value: null, onChange: (u) => {
                captured = u;
            }, getKey: (u) => u.id }));
        const items = container.querySelectorAll('li');
        fireEvent.click(items[1]);
        expect(captured).toEqual({ id: '2', name: 'Bob' });
    });
    it('static withProps exists', () => {
        expect(typeof Select.withProps).toBe('function');
    });
    it('static extend exists', () => {
        expect(typeof Select.extend).toBe('function');
    });
    it('withProps preserves the generic so callers can still type-parameterize', () => {
        // No `as any` casts — the generic typing flows through withProps.
        const SearchableSelect = Select.withProps({ renderItem: ((u) => `★ ${u.name ?? ''}`) });
        const users = [{ id: '1', name: 'Alice' }];
        const { container } = wrap(_jsx(SearchableSelect, { items: users, value: null, onChange: () => { }, getKey: (u) => u.id }));
        expect(container.querySelector('li')?.textContent).toBe('★ Alice');
    });
});
//# sourceMappingURL=define-generic-component.test.js.map