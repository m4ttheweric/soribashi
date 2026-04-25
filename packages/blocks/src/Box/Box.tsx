import { definePolymorphicComponent } from '@soribashi/factory';

type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
type SurfaceToken = 'canvas' | 'default' | 'raised' | 'sunken' | 'overlay';

export interface BoxOwnProps {
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pb?: SpacingToken;
  pl?: SpacingToken;
  pr?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken | 'auto';
  my?: SpacingToken;
  mt?: SpacingToken;
  mb?: SpacingToken;
  ml?: SpacingToken;
  mr?: SpacingToken;
  radius?: RadiusToken;
  bg?: SurfaceToken;
}

export const Box = definePolymorphicComponent<BoxOwnProps, 'div'>({
  name: 'Box',
  defaultElement: 'div',
  selectors: ['root'] as const,
  classes: { root: 'sb-Box-root' },
  render: ({ Element, props, getStyles }) => {
    const {
      p, px, py, pt, pb, pl, pr,
      m, mx, my, mt, mb, ml, mr,
      radius, bg,
      children,
      classNames, styles, vars, attributes, unstyled, className, style,
      ...rest
    } = props as any;
    return (
      <Element
        {...getStyles('root')}
        {...rest}
        data-p={p}
        data-px={px}
        data-py={py}
        data-pt={pt}
        data-pb={pb}
        data-pl={pl}
        data-pr={pr}
        data-m={m}
        data-mx={mx}
        data-my={my}
        data-mt={mt}
        data-mb={mb}
        data-ml={ml}
        data-mr={mr}
        data-radius={radius}
        data-bg={bg}
      >
        {children}
      </Element>
    );
  },
});
