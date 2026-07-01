import { type ElementType, type Ref, forwardRef } from 'react';
import type { FactoryPayload } from './types/factory-payload.ts';
import { makeWithProps } from './with-props.tsx';

const identity = <T,>(value: T): T => value;

/**
 * Lower-level polymorphic factory escape hatch.
 *
 * NOTE: `extend` is the identity function (Mantine parity), NOT the
 * ThemeComponentEntry builder the define* builders attach. Passing
 * `Component.extend({...})` output to `createTheme({ components: [...] })`
 * throws. Use definePolymorphicComponent if the component needs theme entries.
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
