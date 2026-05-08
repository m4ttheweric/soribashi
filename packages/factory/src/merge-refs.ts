import type { Ref, RefCallback } from 'react';

/**
 * Return type of mergeRefs: a ref callback that may also return a cleanup
 * function (R19 semantics). The return type mirrors what React 18.3's
 * `RefCallback` allows via its `DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES`
 * extension point, but we declare it explicitly so callers can handle the
 * cleanup without a type error.
 */
export type MergedRefCallback<T> = (node: T | null) => void | (() => void);

/** Forwards a node to any combination of ref objects and ref callbacks;
 * silently skips null/undefined entries.
 *
 * React 19 ref-callback cleanup: if a constituent callback ref returns a
 * function, the merged ref collects all returned cleanups and itself returns
 * a composed cleanup that calls each one in order. On React 18, callback refs
 * return void, so the cleanup path is a no-op. */
export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined | null>
): MergedRefCallback<T> {
  return (node: T | null): void | (() => void) => {
    const cleanups: Array<() => void> = [];
    for (const ref of refs) {
      if (ref === null || ref === undefined) continue;
      if (typeof ref === 'function') {
        const result = (ref as MergedRefCallback<T>)(node);
        if (typeof result === 'function') {
          cleanups.push(result);
        }
      } else {
        (ref as { current: T | null }).current = node;
      }
    }
    if (cleanups.length > 0) {
      return () => {
        for (const cleanup of cleanups) {
          try {
            cleanup();
          } catch {
            // Don't let one failing cleanup break the others
          }
        }
      };
    }
  };
}
