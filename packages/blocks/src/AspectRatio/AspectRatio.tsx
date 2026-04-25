import { defineComponent } from '@soribashi/factory';

export interface AspectRatioOwnProps {
  ratio?: number;
}

export const AspectRatio = defineComponent<AspectRatioOwnProps>({
  name: 'AspectRatio',
  selectors: ['root'] as const,
  classes: { root: 'sb-AspectRatio-root' },
  defaults: { ratio: 16 / 9 },
  render: ({ props, getStyles }) => {
    const { ratio, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    const baseStyles = getStyles('root');
    return (
      <div
        {...baseStyles}
        {...rest}
        style={{ ...((baseStyles as any).style ?? {}), ...((style as any) ?? {}), aspectRatio: ratio }}
      >
        {children}
      </div>
    );
  },
});
