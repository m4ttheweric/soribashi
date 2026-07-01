import {
  Children,
  Fragment,
  type ReactElement,
  type ReactNode,
  type Ref,
  cloneElement,
  forwardRef,
  isValidElement,
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
    if (children != null && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(
        '[soribashi] <Slot> expects a single React element child; received a non-element child and rendered nothing.',
      );
    }
    return null;
  }

  // React.Fragment is a valid element but cloneElement on it silently drops
  // className, style, onClick, and most other props. Throw explicitly so the
  // failure is obvious rather than a silent no-op merge.
  if ((children as ReactElement).type === Fragment) {
    throw new Error('Slot does not accept React.Fragment children. Pass a single element instead.');
  }

  const child = children as ReactElement<{ ref?: Ref<unknown> }>;
  const childRef = getChildRef(child);

  const merged = mergeProps(slotProps, child.props as Record<string, unknown>);

  if (forwardedRef !== null && forwardedRef !== undefined) {
    (merged as { ref?: Ref<unknown> }).ref = childRef
      ? mergeRefs(forwardedRef, childRef)
      : forwardedRef;
  } else if (childRef) {
    (merged as { ref?: Ref<unknown> }).ref = childRef;
  }

  return cloneElement(child, merged);
});

/**
 * Reads the child's own ref across React versions (Radix's getElementRef
 * pattern). React <= 18 stores it on the element; React 19 moved it to props.
 * Dev builds install warning getters on the wrong-location property, so probe
 * property descriptors for the isReactWarning flag before touching either.
 */
function getChildRef(element: ReactElement): Ref<unknown> | undefined {
  let getter = Object.getOwnPropertyDescriptor(element.props, 'ref')?.get;
  let mayWarn =
    getter && 'isReactWarning' in getter && (getter as { isReactWarning?: boolean }).isReactWarning;
  if (mayWarn) {
    return (element as { ref?: Ref<unknown> }).ref;
  }

  getter = Object.getOwnPropertyDescriptor(element, 'ref')?.get;
  mayWarn =
    getter && 'isReactWarning' in getter && (getter as { isReactWarning?: boolean }).isReactWarning;
  if (mayWarn) {
    return (element.props as { ref?: Ref<unknown> }).ref;
  }

  return (element.props as { ref?: Ref<unknown> }).ref ?? (element as { ref?: Ref<unknown> }).ref;
}
