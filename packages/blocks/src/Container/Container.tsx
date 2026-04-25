import { defineComponent } from '@soribashi/factory';

export interface ContainerOwnProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'fluid';
  px?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Container = defineComponent<ContainerOwnProps>({
  name: 'Container',
  selectors: ['root'] as const,
  classes: { root: 'sb-Container-root' },
  defaults: { size: 'lg', px: 'md' },
  render: ({ props, getStyles }) => {
    const { size, px, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-size={size} data-px={px}>
        {children}
      </div>
    );
  },
});
