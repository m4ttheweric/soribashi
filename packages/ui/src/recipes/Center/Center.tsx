import type { ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Center.module.css';

export const recipeCategory = 1 as const;

export interface CenterProps {
  /** Renders `display: inline-flex` instead of `display: flex` @default false */
  inline?: boolean;
  children?: ReactNode;
}

/**
 * Centers its content on both axes. `inline`/`display` are the only prop
 * that vary between renders, and both are structural (not theme values), so
 * Center.module.css needs no recipe-local vars at all: no `vars` config key
 * here, matching Box's implicit no-vars precedent (definePolymorphicComponent's
 * default autoVars call is also a no-op, since Center declares no variants).
 */
export const Center = defineComponent<CenterProps>({
  name: 'Center',
  selectors: ['root'] as const,
  classes,
  defaults: { inline: false },
  render: ({ props, getStyles, ref }) => {
    const {
      inline,
      children,
      classNames: _cn,
      styles: _st,
      vars: _v,
      attributes: _at,
      unstyled: _un,
      ...rest
    } = props as CenterProps & Record<string, unknown>;
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        {...rest}
        data-inline={inline ? 'true' : undefined}
        {...getStyles('root')}
      >
        {children}
      </div>
    );
  },
});

export const centerTheme = Center.extend({});
