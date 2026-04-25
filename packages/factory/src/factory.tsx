import { type ComponentType, type Ref, forwardRef } from 'react';
import type { FactoryPayload } from './types/factory-payload.ts';
import { makeWithProps } from './with-props.tsx';

const identity = <T,>(value: T): T => value;

/**
 * Mantine-style factory function. Mostly types — at runtime it just attaches
 * extend (identity) and withProps statics.
 */
export type FactoryComponent<P extends FactoryPayload> = ComponentType<
  P['props'] & { ref?: Ref<P['ref']> }
> & {
  extend: (config: any) => any;
  withProps: (presets: Partial<P['props']>) => ComponentType<P['props']>;
  classes?: Partial<Record<NonNullable<P['stylesNames']>, string>>;
  displayName?: string;
};

export function factory<P extends FactoryPayload>(
  render: (props: P['props'], ref: Ref<P['ref']>) => React.ReactNode,
): FactoryComponent<P> {
  const Component = forwardRef<P['ref'], P['props']>(
    (props, ref) => render(props, ref) as React.ReactElement,
  ) as unknown as FactoryComponent<P>;

  Component.extend = identity;
  Component.withProps = makeWithProps(Component as unknown as ComponentType<P['props']>);

  return Component;
}
