import { defineComponent, getSpacing } from '@soribashi/core';
import type { CSSProperties, ReactNode } from 'react';
import { Children } from 'react';
import classes from './Group.module.css';

export const recipeCategory = 1 as const;

export interface GroupProps {
  /** Theme spacing key or any CSS gap value @default 'md' */
  gap?: string | number;
  /** flex-wrap @default 'wrap' */
  wrap?: CSSProperties['flexWrap'];
  /** justify-content @default 'flex-start' */
  justify?: CSSProperties['justifyContent'];
  /** align-items @default 'center' */
  align?: CSSProperties['alignItems'];
  /** Each child grows to fill the row's available width @default false */
  grow?: boolean;
  /** When `grow`, caps each child's width so the row can't overflow @default true */
  preventGrowOverflow?: boolean;
  children?: ReactNode;
}

export const Group = defineComponent<GroupProps>({
  name: 'Group',
  selectors: ['root'] as const,
  classes,
  defaults: {
    gap: 'md',
    wrap: 'wrap',
    justify: 'flex-start',
    align: 'center',
    grow: false,
    preventGrowOverflow: true,
  },
  vars: (_theme, props) => {
    const p = props as GroupProps;
    const grow = p.grow ?? false;
    const preventGrowOverflow = p.preventGrowOverflow ?? true;
    const root: Record<string, string> = {
      '--sb-group-gap': getSpacing(p.gap) ?? '',
      '--sb-group-wrap': String(p.wrap ?? 'wrap'),
      '--sb-group-justify': String(p.justify ?? 'flex-start'),
      '--sb-group-align': String(p.align ?? 'center'),
    };
    // `--sb-group-child-w` is only meaningful when growth is capped: it caps
    // each child at an even share of the row (minus its share of the gap),
    // so `flex-grow: 1` (Group.module.css's `.root[data-grow] > *`) can't
    // stretch any child past that share and overflow the row.
    if (grow && preventGrowOverflow) {
      const n = Children.count(p.children);
      if (n > 0) {
        root['--sb-group-child-w'] =
          `calc(${(100 / n).toFixed(4)}% - var(--sb-group-gap) * ${n - 1} / ${n})`;
      }
    }
    return { root };
  },
  render: ({ props, getStyles, ref }) => {
    const {
      gap: _gap,
      wrap: _wrap,
      justify: _justify,
      align: _align,
      grow,
      preventGrowOverflow: _preventGrowOverflow,
      children,
      classNames: _cn,
      styles: _st,
      vars: _v,
      attributes: _at,
      unstyled: _un,
      ...rest
    } = props as GroupProps & Record<string, unknown>;
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        {...rest}
        data-grow={grow ? 'true' : undefined}
        {...getStyles('root')}
      >
        {children}
      </div>
    );
  },
});

export const groupTheme = Group.extend({});
