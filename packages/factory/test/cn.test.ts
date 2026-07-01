import { afterEach, describe, expect, it } from 'vitest';
import { twMerge } from 'tailwind-merge';
import { cn, configureClassNameMerge } from '../src/cn.ts';

describe('cn', () => {
  afterEach(() => {
    configureClassNameMerge(null);
  });

  it('combines string class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('flattens arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('handles object syntax (clsx-style)', () => {
    expect(cn({ a: true, b: false, c: true })).toBe('a c');
  });

  // Intentional behavior change from the original parity target: the default
  // is clsx-only because twMerge silently drops utility-looking classes
  // (flex, hidden, block) on non-Tailwind substrates.
  it('keeps utility-looking classes by default (flex + block both survive)', () => {
    expect(cn('flex', 'block')).toBe('flex block');
  });

  it('does not resolve Tailwind conflicts by default (clsx-only)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-2 px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-sm text-lg');
  });

  it('preserves non-conflicting Tailwind classes', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2');
  });

  it('configureClassNameMerge(twMerge) opts into Tailwind conflict resolution', () => {
    configureClassNameMerge(twMerge);
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('configureClassNameMerge(null) restores the clsx-only default', () => {
    configureClassNameMerge(twMerge);
    configureClassNameMerge(null);
    expect(cn('px-2', 'px-4')).toBe('px-2 px-4');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
