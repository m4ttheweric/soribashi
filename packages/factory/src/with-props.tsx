import {
  type ComponentType,
  type ForwardRefExoticComponent,
  type Ref,
  forwardRef,
} from 'react';

/**
 * Creates a preset variant of a component by pre-applying default props.
 * Instance props always win over presets.
 */
export function makeWithProps<TProps>(
  Base: ComponentType<TProps> | ForwardRefExoticComponent<TProps & { ref?: Ref<any> }>,
) {
  return function withProps(presets: Partial<TProps>): ComponentType<TProps> {
    const Wrapped = forwardRef((props: any, ref: Ref<any>) => {
      const merged: Record<string, unknown> = { ...presets };
      for (const key in props) {
        if (props[key] !== undefined) merged[key] = props[key];
      }
      const Component = Base as ComponentType<any>;
      return <Component ref={ref} {...merged} />;
    });
    Wrapped.displayName = `WithProps(${(Base as any).displayName ?? Base.name ?? 'Component'})`;
    // Propagate extend from the parent component so callers can chain
    // Button.withProps({...}).extend({...}) — matches Mantine factory.tsx line 91.
    if ((Base as any).extend !== undefined) {
      (Wrapped as any).extend = (Base as any).extend;
    }
    return Wrapped as unknown as ComponentType<TProps>;
  };
}
