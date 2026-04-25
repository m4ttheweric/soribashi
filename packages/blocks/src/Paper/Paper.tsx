import { defineComponent } from '@soribashi/factory';

export interface PaperOwnProps {
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  withBorder?: boolean;
  bg?: 'canvas' | 'default' | 'raised' | 'sunken';
  p?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Paper = defineComponent<PaperOwnProps>({
  name: 'Paper',
  selectors: ['root'] as const,
  classes: { root: 'sb-Paper-root' },
  defaults: { shadow: 'sm', radius: 'md', withBorder: false, bg: 'default', p: 'md' },
  render: ({ props, getStyles }) => {
    const { shadow, radius, withBorder, bg, p, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div
        {...getStyles('root')}
        {...rest}
        data-shadow={shadow}
        data-radius={radius}
        data-with-border={withBorder}
        data-bg={bg}
        data-p={p}
      >
        {children}
      </div>
    );
  },
});
