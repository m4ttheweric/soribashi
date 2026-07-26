import type { ReactNode } from 'react';
import { createElement } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Title.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

export type TitleOrder = 1 | 2 | 3 | 4 | 5 | 6;

export interface TitleProps {
  /** Heading level; also selects the rendered h{order} element @default 1 */
  order?: TitleOrder;
  children?: ReactNode;
}

/**
 * Renders a real `h{order}` element (never polymorphic via `as`: the order
 * IS the element choice, so a second polymorphism axis would be redundant
 * -- see the authoring-a-recipe skill's builder-selection guidance for
 * "polymorphism senseless for the recipe" -> defineComponent). `order` is a
 * discrete 1-6 level, not a theme vocabulary value (CLAUDE.md invariant 2 is
 * about size/intent/variant specifically), so it needs no vocabularyAxes
 * entry; it's a plain own-prop stamped onto `data-order` by hand, the same
 * way Container.tsx hand-stamps `data-fluid`.
 */
export const Title = defineComponent<TitleProps>({
  name: 'Title',
  selectors: ['root'] as const,
  classes,
  defaults: { order: 1 },
  render: ({ props, getStyles, ref }) => {
    const {
      order,
      children,
      classNames: _cn,
      styles: _st,
      vars: _v,
      attributes: _at,
      unstyled: _un,
      ...rest
    } = props as TitleProps & Record<string, unknown>;
    const resolvedOrder = order ?? 1;
    return createElement(
      `h${resolvedOrder}`,
      {
        ref: ref as React.Ref<HTMLHeadingElement>,
        ...rest,
        'data-order': String(resolvedOrder),
        ...getStyles('root'),
      },
      children,
    );
  },
});

export const titleTheme = Title.extend({});
