/**
 * Universal style-prop extraction hook shared by all four builders
 * (defineComponent, definePolymorphicComponent, defineGenericComponent, and
 * defineCompound's Root part). Mirrors the extract -> parse -> responsive
 * class -> visibility class pipeline that used to live inline in Box.tsx, but
 * returns the pieces instead of rendering an element directly, so every
 * builder can splice them into its own render path.
 */
import type { ReactNode } from 'react';
import { InlineStyles } from '../inline-styles/InlineStyles.tsx';
import { useTheme } from '../provider/use-theme.ts';
import { useRandomClassName } from '../use-random-class-name.ts';
import { extractStyleProps } from './extract-style-props.ts';
import { parseStyleProps } from './parse-style-props.ts';
import { STYLE_PROPS_DATA } from './style-props-data.ts';

export interface UseStylePropsResult {
  /** merged props with every style prop and visibility prop removed; builders hand THIS to useStyles' varsResolver input and to the recipe render */
  rest: Record<string, unknown>;
  /** static parsed styles; useStyles layers these onto the 'root' slot AFTER config.style, so a style prop always wins over an instance `style` prop targeting the same property */
  rootStyle: Record<string, string> | null;
  /** responsive class (when responsive values exist) plus visibility utility classes, space-joined, for the 'root' slot */
  rootClassName: string;
  /** the <InlineStyles> element for responsive media rules, or null; builders render it in a fragment before the recipe output */
  styleNode: ReactNode;
}

interface VisibilityProps {
  hiddenFrom?: string;
  visibleFrom?: string;
  lightHidden?: boolean;
  darkHidden?: boolean;
}

/**
 * Extracts Box-style style props (`p`, `m`, `bg`, ...) plus the four
 * visibility props (`hiddenFrom`, `visibleFrom`, `lightHidden`, `darkHidden`)
 * from a merged props record.
 *
 * `useTheme` and `useRandomClassName` are called unconditionally (React hook
 * rules) before the fast-path decision below, so hook order never depends on
 * whether a given instance actually used any style props.
 */
export function useStyleProps(props: Record<string, unknown>): UseStylePropsResult {
  const theme = useTheme();
  const responsiveClassName = useRandomClassName();

  const { styleProps, rest: withoutStyleProps } = extractStyleProps(props, STYLE_PROPS_DATA);

  const visibility = withoutStyleProps as VisibilityProps;
  const hasVisibilityProp =
    visibility.hiddenFrom !== undefined ||
    visibility.visibleFrom !== undefined ||
    visibility.lightHidden !== undefined ||
    visibility.darkHidden !== undefined;

  // Fast path: extractStyleProps found no style prop (same object reference
  // returned) and no visibility prop is present either. This is the
  // overwhelmingly common case across every recipe render and must not
  // allocate a new props object or parse anything.
  if (withoutStyleProps === props && !hasVisibilityProp) {
    return { rest: props, rootStyle: null, rootClassName: '', styleNode: null };
  }

  const { hiddenFrom, visibleFrom, lightHidden, darkHidden, ...rest } = withoutStyleProps as Record<
    string,
    unknown
  > &
    VisibilityProps;

  const parsed = parseStyleProps({ styleProps, data: STYLE_PROPS_DATA, theme });

  const visibilityClasses = [
    hiddenFrom ? `sb-hidden-from-${hiddenFrom}` : '',
    visibleFrom ? `sb-visible-from-${visibleFrom}` : '',
    lightHidden ? 'sb-light-hidden' : '',
    darkHidden ? 'sb-dark-hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const rootClassName = [parsed.hasResponsiveStyles ? responsiveClassName : '', visibilityClasses]
    .filter(Boolean)
    .join(' ');

  const rootStyle = Object.keys(parsed.inlineStyles).length > 0 ? parsed.inlineStyles : null;

  const styleNode: ReactNode = parsed.hasResponsiveStyles ? (
    <InlineStyles
      selector={`.${responsiveClassName}`}
      styles={parsed.styles}
      media={parsed.media}
    />
  ) : null;

  return { rest, rootStyle, rootClassName, styleNode };
}
