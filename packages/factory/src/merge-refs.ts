import type { Ref, RefCallback } from 'react';

/** Forwards a node to any combination of ref objects and ref callbacks;
 * silently skips null/undefined entries. */
export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined | null>
): RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (ref === null || ref === undefined) continue;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}
