import { describe, expect, it } from 'vitest';
import { getTitleSize } from '../src/Title/get-title-size.ts';

describe('getTitleSize', () => {
  it('resolves h1-h6 tokens to heading vars', () => {
    expect(getTitleSize(2, 'h3').fontSize).toBe('var(--heading-h3-font-size)');
  });

  it('defaults to the order heading when size is unset', () => {
    expect(getTitleSize(4).fontSize).toBe('var(--heading-h4-font-size)');
  });

  it('resolves font-size tokens including digit-leading 2xl/3xl', () => {
    expect(getTitleSize(1, 'sm').fontSize).toBe('var(--font-size-sm)');
    expect(getTitleSize(1, '2xl').fontSize).toBe('var(--font-size-2xl)');
    expect(getTitleSize(1, '3xl').fontSize).toBe('var(--font-size-3xl)');
  });

  it('resolves custom font-size token keys open-endedly', () => {
    expect(getTitleSize(1, 'display').fontSize).toBe('var(--font-size-display)');
    expect(getTitleSize(1, 'custom-key').fontSize).toBe('var(--font-size-custom-key)');
  });

  it('passes raw CSS values through rem conversion', () => {
    expect(getTitleSize(1, '2.5rem').fontSize).toBe('2.5rem');
    expect(getTitleSize(1, 24).fontSize).toBe('1.5rem');
  });
});
