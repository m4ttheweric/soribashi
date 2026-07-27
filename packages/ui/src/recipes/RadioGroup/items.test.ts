import { describe, expect, it } from 'vitest';
import { resolveRadioGroupItems } from './items.ts';

describe('resolveRadioGroupItems (node tier, pure logic)', () => {
  it('resolves default {label, value}-shaped items with no accessors', () => {
    const items = [
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro' },
    ];

    const resolved = resolveRadioGroupItems(items);

    expect(resolved).toEqual([
      { value: 'free', label: 'Free', description: undefined, item: items[0] },
      { value: 'pro', label: 'Pro', description: undefined, item: items[1] },
    ]);
  });

  it('resolves via custom getLabel/getValue accessors on an arbitrary item shape', () => {
    interface Plan {
      id: number;
      name: string;
    }
    const items: Plan[] = [
      { id: 1, name: 'Free' },
      { id: 2, name: 'Pro' },
    ];

    const resolved = resolveRadioGroupItems(items, {
      getLabel: (p) => p.name,
      getValue: (p) => p.id,
    });

    expect(resolved).toEqual([
      { value: 1, label: 'Free', description: undefined, item: items[0] },
      { value: 2, label: 'Pro', description: undefined, item: items[1] },
    ]);
  });

  it('passes description through directly, with no accessor involved', () => {
    const items = [
      { label: 'Free', value: 'free', description: 'Basic features' },
      { label: 'Pro', value: 'pro', description: 'Everything, plus support' },
    ];

    const resolved = resolveRadioGroupItems(items);

    expect(resolved.map((r) => r.description)).toEqual([
      'Basic features',
      'Everything, plus support',
    ]);
  });

  it('leaves description undefined when the item has none, without throwing', () => {
    const items = [{ label: 'Free', value: 'free' }];

    const resolved = resolveRadioGroupItems(items);

    expect(resolved[0]?.description).toBeUndefined();
  });

  it('returns an empty array for an empty items array', () => {
    expect(resolveRadioGroupItems([])).toEqual([]);
  });

  it('rejects duplicate resolved values with a descriptive error', () => {
    const items = [
      { label: 'A', value: 'dup' },
      { label: 'B', value: 'dup' },
    ];

    expect(() => resolveRadioGroupItems(items)).toThrowError(/duplicate/i);
  });

  // Copies the loud-throw fix's pin shape from Select's items.test.ts: a
  // single non-{label,value} item with no accessors must throw, naming the
  // item's index and the missing property, rather than silently rendering a
  // blank, unlabeled, or valueless radio.
  it('throws naming the item index when a single item has no "label" and no getLabel is supplied', () => {
    const items = [{ value: 'a' }];

    expect(() => resolveRadioGroupItems(items)).toThrowError(/index 0.*"label"/i);
  });

  it('throws naming the item index when a single item has no "value" and no getValue is supplied', () => {
    const items = [{ label: 'Free' }];

    expect(() => resolveRadioGroupItems(items)).toThrowError(/index 0.*"value"/i);
  });

  it('throws for the first non-conforming item even when earlier items are well-formed', () => {
    const items = [
      { label: 'Free', value: 'free' },
      { id: 2, name: 'Pro' },
    ];

    expect(() => resolveRadioGroupItems(items)).toThrowError(/index 1/);
  });

  it('does not throw for a deliberately empty label or a deliberately falsy value', () => {
    const items = [{ label: '', value: 0 }];

    const resolved = resolveRadioGroupItems(items);

    expect(resolved).toEqual([{ value: 0, label: '', description: undefined, item: items[0] }]);
  });

  it('does not throw when getLabel/getValue accessors are supplied for a non-{label,value} shape', () => {
    const items = [{ id: 1, name: 'Ada' }];

    const resolved = resolveRadioGroupItems(items, {
      getLabel: (u) => u.name,
      getValue: (u) => u.id,
    });

    expect(resolved).toEqual([{ value: 1, label: 'Ada', description: undefined, item: items[0] }]);
  });
});
