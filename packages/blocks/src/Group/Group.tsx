import { defineComponent } from '@soribashi/factory';

export interface GroupOwnProps {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
}

export const Group = defineComponent<GroupOwnProps>({
  name: 'Group',
  selectors: ['root'] as const,
  classes: { root: 'sb-Group-root' },
  defaults: { gap: 'md', align: 'center', justify: 'start', wrap: 'wrap' },
  render: ({ props, getStyles }) => {
    const { gap, align, justify, wrap, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
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
