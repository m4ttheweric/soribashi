import { defineComponent } from '@soribashi/factory';

export interface StackOwnProps {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export const Stack = defineComponent<StackOwnProps>({
  name: 'Stack',
  selectors: ['root'] as const,
  classes: { root: 'sb-Stack-root' },
  defaults: { gap: 'md', align: 'stretch', justify: 'start' },
  render: ({ props, getStyles }) => {
    const { gap, align, justify, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
        data-gap={gap}
        data-align={align}
        data-justify={justify}
      >
        {children}
      </div>
    );
  },
});
