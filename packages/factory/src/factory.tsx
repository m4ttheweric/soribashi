import { type ComponentType, type Ref, forwardRef } from 'react';
import type { FactoryPayload } from './types/factory-payload.ts';
import { makeWithProps } from './with-props.tsx';

const identity = <T,>(value: T): T => value;

/**
 * Mantine-style factory function. Mostly types — at runtime it just attaches
 * extend (identity) and withProps statics.
 *
 * NOTE: `extend` is the identity function (Mantine parity), NOT the
 * ThemeComponentEntry builder the define* builders attach. Passing
 * `Component.extend({...})` output to `createTheme({ components: [...] })`
 * throws, because the result is the raw config object rather than a tagged
 * entry. Use a define* builder if the component needs theme entries.
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
