import clsx from 'clsx';
import type { CSSProperties } from 'react';

/** Merge two prop objects per Slot semantics: className composes, style merges
 * shallowly with child winning, event handlers compose (slot first, child
 * second; both called), other props let child win. Pure function — no React
 * semantics. */
export function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...slotProps };

  for (const key in childProps) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];

    if (key === 'className') {
      out[key] = clsx(slotValue as string | undefined, childValue as string | undefined);
    } else if (key === 'style') {
      out[key] = {
        ...(slotValue as CSSProperties | undefined),
        ...(childValue as CSSProperties | undefined),
      };
    } else if (
      key.startsWith('on') &&
      typeof slotValue === 'function' &&
      typeof childValue === 'function'
    ) {
      out[key] = (...args: unknown[]) => {
        (slotValue as (...a: unknown[]) => unknown)(...args);
        (childValue as (...a: unknown[]) => unknown)(...args);
      };
    } else {
      out[key] = childValue;
    }
  }

  return out;
}
