import { defineComponent } from '@soribashi/factory';

export interface SimpleGridOwnProps {
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const SimpleGrid = defineComponent<SimpleGridOwnProps>({
  name: 'SimpleGrid',
  selectors: ['root'] as const,
  classes: { root: 'sb-SimpleGrid-root' },
  defaults: { cols: 2, gap: 'md' },
  render: ({ props, getStyles }) => {
    const { cols, gap, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-cols={cols} data-gap={gap}>
        {children}
      </div>
    );
  },
});
