import { type Ref, forwardRef } from 'react';
import { makeWithProps } from './with-props.tsx';

const identity = <T,>(value: T): T => value;

/**
 * Lower-level generic factory escape hatch.
 */
export function genericComponent(
  render: (props: any, ref: Ref<unknown>) => React.ReactNode,
) {
  const Component = forwardRef<unknown, any>(
    (props, ref) => render(props, ref) as React.ReactElement,
  );
  (Component as any).extend = identity;
  (Component as any).withProps = makeWithProps(Component as any);
  return Component as any;
}
