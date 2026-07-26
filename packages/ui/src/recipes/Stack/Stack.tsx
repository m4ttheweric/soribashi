import { getSpacing } from '@soribashi/core';
import type { CSSProperties, ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Stack.module.css';

export const recipeCategory = 1 as const;

export interface StackProps {
  /** Theme spacing key or any CSS gap value @default 'md' */
  gap?: string | number;
  /** align-items @default 'stretch' */
  align?: CSSProperties['alignItems'];
  /** justify-content @default 'flex-start' */
  justify?: CSSProperties['justifyContent'];
  children?: ReactNode;
}

export const Stack = defineComponent<StackProps>({
  name: 'Stack',
  selectors: ['root'] as const,
  classes,
  defaults: { gap: 'md', align: 'stretch', justify: 'flex-start' },
  vars: (_theme, props) => ({
    root: {
      '--sb-stack-gap': getSpacing((props as StackProps).gap) ?? '',
      '--sb-stack-align': String((props as StackProps).align ?? 'stretch'),
      '--sb-stack-justify': String((props as StackProps).justify ?? 'flex-start'),
    },
  }),
  render: ({ props, getStyles, ref }) => {
    const {
      gap: _gap,
      align: _align,
      justify: _justify,
      children,
      classNames: _cn,
      styles: _st,
      vars: _v,
      attributes: _at,
      unstyled: _un,
      ...rest
    } = props as StackProps & Record<string, unknown>;
    return (
      <div ref={ref as React.Ref<HTMLDivElement>} {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const stackTheme = Stack.extend({});
