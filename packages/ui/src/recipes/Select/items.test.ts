import { describe, expect, it } from 'vitest';
import { resolveSelectItems } from './items.ts';

describe('resolveSelectItems (node tier, pure logic)', () => {
  it('resolves default {label, value}-shaped items with no accessors', () => {
    const items = [
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' },
    ];

    const resolved = resolveSelectItems(items);

    expect(resolved.flat).toEqual([
      { value: 'a', label: 'Alpha', item: items[0] },
      { value: 'b', label: 'Beta', item: items[1] },
    ]);
    expect(resolved.groups).toBeNull();
  });

  it('resolves via custom getLabel/getValue accessors on an arbitrary item shape', () => {
    interface User {
      id: number;
      name: string;
    }
    const items: User[] = [
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' },
    ];

    const resolved = resolveSelectItems(items, {
      getLabel: (u) => u.name,
      getValue: (u) => u.id,
    });

    expect(resolved.flat).toEqual([
      { value: 1, label: 'Ada', item: items[0] },
      { value: 2, label: 'Grace', item: items[1] },
    ]);
  });

  it('groups items, preserving item order within each group, and group order by first appearance', () => {
    interface Item {
      label: string;
      value: string;
      group: string;
    }
    const items: Item[] = [
      { label: 'Apple', value: 'apple', group: 'Fruit' },
      { label: 'Carrot', value: 'carrot', group: 'Vegetable' },
      { label: 'Banana', value: 'banana', group: 'Fruit' },
      { label: 'Pea', value: 'pea', group: 'Vegetable' },
    ];

    const resolved = resolveSelectItems(items, { getGroup: (i) => i.group });

    expect(resolved.groups).not.toBeNull();
    expect(resolved.groups?.map((g) => g.group)).toEqual(['Fruit', 'Vegetable']);
    expect(resolved.groups?.[0]?.items.map((i) => i.label)).toEqual(['Apple', 'Banana']);
    expect(resolved.groups?.[1]?.items.map((i) => i.label)).toEqual(['Carrot', 'Pea']);
    // Flat order is untouched by grouping: original item order, not
    // grouped/rearranged order.
    expect(resolved.flat.map((i) => i.label)).toEqual(['Apple', 'Carrot', 'Banana', 'Pea']);
  });

  it('treats items with no group as ungrouped when getGroup is not supplied at all', () => {
    const items = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ];

    const resolved = resolveSelectItems(items);

    expect(resolved.groups).toBeNull();
  });

  it('returns an empty flat list and null groups for an empty items array', () => {
    const resolved = resolveSelectItems([]);

    expect(resolved.flat).toEqual([]);
    expect(resolved.groups).toBeNull();
  });

  it('rejects duplicate resolved values with a descriptive error', () => {
    const items = [
      { label: 'A', value: 'dup' },
      { label: 'B', value: 'dup' },
    ];

    expect(() => resolveSelectItems(items)).toThrowError(/duplicate/i);
  });
});
