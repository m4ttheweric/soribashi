import type { ReactNode } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './AspectRatio.module.css';

export const recipeCategory = 1 as const;

export interface AspectRatioProps {
  /** width / height CSS aspect-ratio @default 1 */
  ratio?: number;
  children?: ReactNode;
}

export const AspectRatio = defineComponent<AspectRatioProps>({
  name: 'AspectRatio',
  selectors: ['root'] as const,
  classes,
  defaults: { ratio: 1 },
  vars: (_theme, props) => ({
    root: {
      '--sb-ratio': String((props as AspectRatioProps).ratio ?? 1),
    },
  }),
  render: ({ props, getStyles, ref }) => {
    const {
      ratio: _ratio,
      children,
      classNames: _cn,
      styles: _st,
      vars: _v,
      attributes: _at,
      unstyled: _un,
      ...rest
    } = props as AspectRatioProps & Record<string, unknown>;
    return (
      <div ref={ref as React.Ref<HTMLDivElement>} {...rest} {...getStyles('root')}>
        {children}
      </div>
    );
  },
});

export const aspectRatioTheme = AspectRatio.extend({});
