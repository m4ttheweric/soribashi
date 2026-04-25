import { defineComponent } from '@soribashi/factory';

export interface CenterOwnProps {
  inline?: boolean;
}

export const Center = defineComponent<CenterOwnProps>({
  name: 'Center',
  selectors: ['root'] as const,
  classes: { root: 'sb-Center-root' },
  defaults: { inline: false },
  render: ({ props, getStyles }) => {
    const { inline, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <div {...getStyles('root')} {...rest} data-inline={inline}>
        {children}
      </div>
    );
  },
});
