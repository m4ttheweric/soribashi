import { defineComponent } from '@soribashi/core';
import type { ReactNode } from 'react';
import classes from './Container.module.css';

export const recipeCategory = 1 as const;

/**
 * Widths keyed on the ui theme's size vocabulary. Lives in the recipe (not
 * the framework) because @soribashi/ui is a consumer and owns these values;
 * a theme can still override per instance via Container.extend({ vars })
 * or Container.extend({ defaultProps: { size } }).
 */
const CONTAINER_WIDTHS: Record<string, string> = {
  xs: '30rem',
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
};

export interface ContainerProps {
  /** Removes the max-width cap, filling 100% of the available width @default false */
  fluid?: boolean;
  children?: ReactNode;
}

/**
 * `size` is injected by `vocabularyAxes: ['size']` rather than declared on
 * `ContainerProps` directly (Global Constraint: vocabulary axis props come
 * from the builder, not the recipe's own prop type); `getStyles('root')`
 * already stamps `data-size` from it, so Container adds nothing extra there.
 */
export const Container = defineComponent<
  ContainerProps,
  readonly ['root'],
  readonly [],
  readonly ['size']
>({
  name: 'Container',
  vocabularyAxes: ['size'] as const,
  selectors: ['root'] as const,
  classes,
  defaults: { size: 'md', fluid: false },
  vars: (_theme, props) => {
    const size = (props as { size?: string }).size ?? 'md';
    return {
      root: {
        '--sb-container-w': CONTAINER_WIDTHS[size] ?? CONTAINER_WIDTHS.md!,
      },
    };
  },
  render: ({ props, getStyles, ref }) => {
    const {
      size: _size,
      fluid,
      children,
      classNames: _cn,
      styles: _st,
      vars: _v,
      attributes: _at,
      unstyled: _un,
      ...rest
    } = props as ContainerProps & Record<string, unknown>;
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        {...rest}
        data-fluid={fluid ? 'true' : undefined}
        {...getStyles('root')}
      >
        {children}
      </div>
    );
  },
});

export const containerTheme = Container.extend({});
