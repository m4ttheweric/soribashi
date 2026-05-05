import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { mergeProps } from './merge-props.ts';
import { mergeRefs } from './merge-refs.ts';

export interface SlotProps {
  children?: ReactNode;
  [key: string]: unknown;
}

/**
 * Substrate-agnostic asChild slot-merging helper. Renders its single child,
 * merging the slot's props onto it: className composes, style merges shallowly
 * (child wins on collisions), event handlers compose (slot first, child second),
 * refs compose, other props let child win.
 *
 * For Radix-wrapping consumers, prefer Radix's own Slot via `asChild` on the
 * Radix part (e.g., `<RadixTooltip.Trigger asChild>`); this Slot is for parts
 * that do NOT wrap a Radix component (e.g., Tabs Wave 3 / Select Wave 4 /
 * non-Radix consumer libraries).
 */
export const Slot = forwardRef<unknown, SlotProps>(function Slot(props, forwardedRef) {
  const { children, ...slotProps } = props;

  // Enforce single-child contract: throw when more than one child is provided.
  // Children.count works on arrays, fragments, and primitives alike.
  const count = Children.count(children);
  if (count > 1) {
    // Delegate to Children.only to get React's canonical error message.
    Children.only(children);
  }

  // Non-element single child (text, number, null, etc.) — render nothing.
  if (!isValidElement(children)) {
    return null;
  }

  const child = children as ReactElement<{ ref?: Ref<unknown> }>;
  const childRef = (child as { ref?: Ref<unknown> }).ref;

  const merged = mergeProps(slotProps, child.props as Record<string, unknown>);

  if (forwardedRef !== null && forwardedRef !== undefined) {
    (merged as { ref?: Ref<unknown> }).ref = mergeRefs(forwardedRef, childRef);
  } else if (childRef) {
    (merged as { ref?: Ref<unknown> }).ref = childRef;
  }

  return cloneElement(child, merged);
});
