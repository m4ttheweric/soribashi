import { defineComponent } from '@soribashi/factory';

export interface TitleOwnProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted';
  align?: 'left' | 'center' | 'right';
}

export const Title = defineComponent<TitleOwnProps>({
  name: 'Title',
  selectors: ['root'] as const,
  classes: { root: 'sb-Title-root' },
  defaults: { level: 1, weight: 'bold', color: 'default' },
  render: ({ props, getStyles }) => {
    const { level, weight, color, align, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    const Tag = `h${level ?? 1}` as keyof JSX.IntrinsicElements;
    return (
      <Tag
        {...(getStyles('root') as any)}
        {...rest}
        data-level={level}
        data-weight={weight}
        data-color={color}
        data-align={align}
      >
        {children}
      </Tag>
    );
  },
});
