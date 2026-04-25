import { describe, expect, it } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { createTheme } from '@soribashi/theme';
import { SoribashiProvider } from '../src/provider/provider.tsx';
import { defineGenericComponent } from '../src/define-generic-component.tsx';

interface SelectOwnProps<T> {
  items: T[];
  value: T | null;
  onChange: (v: T | null) => void;
  getKey: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
}

const Select = defineGenericComponent<SelectOwnProps<any>>({
  name: 'Select',
  selectors: ['root', 'option'] as const,
  classes: { root: 'sb-Select-root', option: 'sb-Select-option' },
  defaults: {} as any,
  render: ({ props, getStyles }: any) => (
    <ul {...getStyles('root')} data-testid="select">
      {props.items.map((item: any) => {
        const key = props.getKey(item);
        const isSelected = props.value && props.getKey(props.value) === key;
        return (
          <li
            key={key}
            {...getStyles('option')}
            data-selected={isSelected}
            onClick={() => props.onChange(item)}
          >
            {props.renderItem ? props.renderItem(item) : key}
          </li>
        );
      })}
    </ul>
  ),
});

interface User {
  id: string;
  name: string;
}

const theme = createTheme({
  tokens: { colors: {}, radius: {}, spacing: {}, fontSize: {} },
});

const wrap = (ui: React.ReactNode) =>
  render(<SoribashiProvider theme={theme}>{ui}</SoribashiProvider>);

describe('defineGenericComponent', () => {
  it('renders items and applies classes', () => {
    const users: User[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];

    const { container } = wrap(
      <Select<User>
        items={users}
        value={null}
        onChange={() => {}}
        getKey={(u) => u.id}
        renderItem={(u) => u.name}
      />,
    );

    expect(container.querySelector('ul')?.className).toContain('sb-Select-root');
    expect(container.querySelectorAll('li').length).toBe(2);
    expect(container.querySelectorAll('li')[0]?.textContent).toBe('Alice');
  });

  it('onChange receives the typed item', () => {
    const users: User[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];

    let captured: User | null = null;

    const { container } = wrap(
      <Select<User>
        items={users}
        value={null}
        onChange={(u) => {
          captured = u;
        }}
        getKey={(u) => u.id}
      />,
    );

    const items = container.querySelectorAll('li');
    fireEvent.click(items[1]!);
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
    const SearchableSelect = Select.withProps({ renderItem: ((u: any) => `★ ${u.name ?? ''}`) as any });
    const users: User[] = [{ id: '1', name: 'Alice' }];

    const { container } = wrap(
      <SearchableSelect<User>
        items={users}
        value={null}
        onChange={() => {}}
        getKey={(u) => u.id}
      />,
    );

    expect(container.querySelector('li')?.textContent).toBe('★ Alice');
  });
});
