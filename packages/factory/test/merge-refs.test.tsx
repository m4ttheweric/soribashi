import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { mergeRefs, type MergedRefCallback } from '../src/merge-refs.ts';

describe('mergeRefs', () => {
  it('forwards a node to multiple ref objects', () => {
    const refA = createRef<HTMLDivElement>();
    const refB = createRef<HTMLDivElement>();
    const merged = mergeRefs(refA, refB);

    render(<div ref={merged} data-testid="el" />);

    expect(refA.current).toBeInstanceOf(HTMLElement);
    expect(refB.current).toBeInstanceOf(HTMLElement);
    expect(refA.current).toBe(refB.current);
  });

  it('forwards a node to ref callbacks', () => {
    const cbA = vi.fn();
    const cbB = vi.fn();
    const merged = mergeRefs<HTMLDivElement>(cbA, cbB);

    render(<div ref={merged} />);

    expect(cbA).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(cbB).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it('handles a mix of ref objects and ref callbacks', () => {
    const refObj = createRef<HTMLDivElement>();
    const refCb = vi.fn();
    const merged = mergeRefs<HTMLDivElement>(refObj, refCb);

    render(<div ref={merged} />);

    expect(refObj.current).toBeInstanceOf(HTMLElement);
    expect(refCb).toHaveBeenCalledWith(refObj.current);
  });

  it('skips null / undefined refs', () => {
    const refObj = createRef<HTMLDivElement>();
    const merged = mergeRefs<HTMLDivElement>(refObj, null, undefined);

    render(<div ref={merged} />);
    expect(refObj.current).toBeInstanceOf(HTMLElement);
  });

  it('returns a merged cleanup when callback refs return cleanups (R19 semantics)', () => {
    const cleanupA = vi.fn();
    const cleanupB = vi.fn();
    const refA: MergedRefCallback<HTMLDivElement> = () => cleanupA;
    const refB: MergedRefCallback<HTMLDivElement> = () => cleanupB;
    const merged = mergeRefs<HTMLDivElement>(refA, refB);

    const fakeNode = {} as HTMLDivElement;
    const cleanup = merged(fakeNode);
    expect(typeof cleanup).toBe('function');
    (cleanup as () => void)();
    expect(cleanupA).toHaveBeenCalled();
    expect(cleanupB).toHaveBeenCalled();
  });

  it('returns void when no callback ref returns a cleanup', () => {
    const refObj = createRef<HTMLDivElement>();
    const refCb = vi.fn() as MergedRefCallback<HTMLDivElement>;
    const merged = mergeRefs<HTMLDivElement>(refObj, refCb);
    const result = merged({} as HTMLDivElement);
    expect(result).toBeUndefined();
  });
});
