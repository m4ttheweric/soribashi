import { definePolymorphicComponent } from '@soribashi/factory';

export interface TextOwnProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'muted' | 'disabled';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
}

export const Text = definePolymorphicComponent<TextOwnProps, 'p'>({
  name: 'Text',
  defaultElement: 'p',
  selectors: ['root'] as const,
  classes: { root: 'sb-Text-root' },
  defaults: { size: 'md', weight: 'normal', color: 'default', truncate: false },
  render: ({ Element, props, getStyles }) => {
    const { size, weight, color, align, truncate, children, classNames, styles, vars, attributes, unstyled, className, style, ...rest } = props as any;
    return (
      <Element
        {...getStyles('root')}
        {...rest}
        data-size={size}
        data-weight={weight}
        data-color={color}
        data-align={align}
        data-truncate={truncate}
      >
        {children}
      </Element>
    );
  },
});
