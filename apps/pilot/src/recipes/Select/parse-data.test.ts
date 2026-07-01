import { describe, expect, it } from 'vitest';
import { flattenOptions, parseSelectData } from './parse-data.ts';

describe('parseSelectData', () => {
  it('wraps bare primitives into { value, label }', () => {
    expect(parseSelectData(['a', 'b'])).toEqual([
      { value: 'a', label: 'a' },
      { value: 'b', label: 'b' },
    ]);
  });

  it('passes through item objects and preserves disabled', () => {
    expect(parseSelectData([{ value: 'x', label: 'X', disabled: true }])).toEqual([
      { value: 'x', label: 'X', disabled: true },
    ]);
  });

  it('labels a value-only object by stringifying its value', () => {
    expect(parseSelectData([{ value: 1 } as any])).toEqual([
      { value: 1, label: '1', disabled: undefined },
    ]);
  });

  it('parses groups recursively', () => {
    expect(parseSelectData([{ group: 'G', items: ['a', { value: 'b', label: 'B' }] }])).toEqual([
      {
        group: 'G',
        items: [
          { value: 'a', label: 'a' },
          { value: 'b', label: 'B' },
        ],
      },
    ]);
  });

  it('returns [] for undefined', () => {
    expect(parseSelectData(undefined)).toEqual([]);
  });
});

describe('flattenOptions', () => {
  it('flattens groups into a single option list', () => {
    const parsed = parseSelectData([{ group: 'G', items: ['a'] }, 'b']);
    expect(flattenOptions(parsed)).toEqual([
      { value: 'a', label: 'a' },
      { value: 'b', label: 'b' },
    ]);
  });
});
