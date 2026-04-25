import { defineComponent } from '@soribashi/factory';

export interface FlexOwnProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
}

export const Flex = defineComponent<FlexOwnProps>({
  name: 'Flex',
  selectors: ['root'] as const,
  classes: { root: 'sb-Flex-root' },
  defaults: { direction: 'row', gap: 'md', wrap: 'nowrap' },
  render: ({ props, getStyles }) => {
    const { direction, gap, align, justify, wrap, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
        data-direction={direction}
        data-gap={gap}
        data-align={align}
        data-justify={justify}
        data-wrap={wrap}
      >
        {children}
      </div>
    );
  },
});
