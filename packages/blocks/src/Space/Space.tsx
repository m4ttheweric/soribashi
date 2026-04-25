import { defineComponent } from '@soribashi/factory';

export interface SpaceOwnProps {
  h?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  w?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Space = defineComponent<SpaceOwnProps>({
  name: 'Space',
  selectors: ['root'] as const,
  classes: { root: 'sb-Space-root' },
  render: ({ props, getStyles }) => {
    const { h, w, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return <div {...getStyles('root')} {...rest} data-h={h} data-w={w} />;
  },
});
