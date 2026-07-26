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

  // Fix round 1, Important finding: a single non-{label,value} item with no
  // accessors previously rendered a blank, unlabeled, valueless option with
  // no error at all (the old defaults silently returned '' / undefined).
  // These pin the loud-throw fix instead.
  it('throws naming the item index when a single item has no "label" and no getLabel is supplied', () => {
    // Has a `value` (so the value check passes) but no `label`, isolating
    // the label-specific throw from the value-specific one below.
    const items = [{ value: 'a' }];

    expect(() => resolveSelectItems(items)).toThrowError(/index 0.*"label"/i);
  });

  it('throws naming the item index when a single item has no "value" and no getValue is supplied', () => {
    const items = [{ label: 'Ada' }];

    expect(() => resolveSelectItems(items)).toThrowError(/index 0.*"value"/i);
  });

  it('throws for the first non-conforming item even when earlier items are well-formed', () => {
    const items = [
      { label: 'A', value: 'a' },
      { id: 2, name: 'Grace' },
    ];

    expect(() => resolveSelectItems(items)).toThrowError(/index 1/);
  });

  it('does not throw for a deliberately empty label or a deliberately falsy value', () => {
    const items = [{ label: '', value: 0 }];

    const resolved = resolveSelectItems(items);

    expect(resolved.flat).toEqual([{ value: 0, label: '', item: items[0] }]);
  });

  it('does not throw when getLabel/getValue accessors are supplied for a non-{label,value} shape', () => {
    const items = [{ id: 1, name: 'Ada' }];

    const resolved = resolveSelectItems(items, { getLabel: (u) => u.name, getValue: (u) => u.id });

    expect(resolved.flat).toEqual([{ value: 1, label: 'Ada', item: items[0] }]);
  });
});
