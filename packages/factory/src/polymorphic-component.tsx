import { type ElementType, type Ref, forwardRef } from 'react';
import { makeWithProps } from './with-props.tsx';
import type { FactoryPayload } from './types/factory-payload.ts';

const identity = <T,>(value: T): T => value;

/**
 * Lower-level polymorphic factory escape hatch.
 */
export function polymorphicComponent<P extends FactoryPayload & { defaultElement: ElementType }>(
  render: (props: P['props'] & { as?: ElementType }, ref: Ref<unknown>) => React.ReactNode,
) {
  const Component = forwardRef<unknown, any>(
    (props, ref) => render(props, ref) as React.ReactElement,
  );
  (Component as any).extend = identity;
  (Component as any).withProps = makeWithProps(Component as any);
  return Component as any;
}
