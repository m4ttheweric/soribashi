import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createSafeContext } from '../src/create-safe-context.ts';

describe('createSafeContext', () => {
  it('returns a tuple of [Context, useSafeContext]', () => {
    const [Ctx, useCtx] = createSafeContext<{ foo: number }>('test');
    expect(Ctx).toBeDefined();
    expect(typeof useCtx).toBe('function');
  });

  it('throws when consumed outside the provider', () => {
    const [, useCtx] = createSafeContext<{ foo: number }>('Foo must be inside <FooProvider>');

    function Consumer() {
      useCtx();
      return null;
    }

    expect(() => render(<Consumer />)).toThrow('Foo must be inside <FooProvider>');
  });

  it('returns the value when consumed inside the provider', () => {
    const [Ctx, useCtx] = createSafeContext<{ foo: number }>('test');
    let captured: { foo: number } | null = null;

    function Consumer() {
      captured = useCtx();
      return null;
    }

    render(
      <Ctx.Provider value={{ foo: 42 }}>
        <Consumer />
      </Ctx.Provider>,
    );

    expect(captured).toEqual({ foo: 42 });
  });
});
