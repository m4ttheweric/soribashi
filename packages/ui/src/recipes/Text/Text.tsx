import { definePolymorphicComponent, getFontSize, getLineHeight } from '@soribashi/core';
import type { ReactNode } from 'react';
import classes from './Text.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

export interface TextProps {
  /** Muted colour via --text-muted @default false */
  dimmed?: boolean;
  /** Single-line overflow ellipsis (overflow/text-overflow/white-space) @default false */
  truncate?: boolean;
  children?: ReactNode;
}

/**
 * AMENDED after Task 2 review: Text declares no `fw` (font-weight) prop.
 * `fw` is a STYLE_PROPS_DATA key (packages/factory/src/style-props/style-props-data.ts),
 * so every recipe already accepts it via the universal style props every
 * builder resolves; an own `fw` prop here would collide with that
 * extraction the same way packages/blocks/src/Space/Space.tsx's regression
 * did (Task 2's report). `<Text fw="...">` is covered on the universal path
 * in Text.test.tsx instead of being redeclared here.
 *
 * `size` is injected by `vocabularyAxes: ['size']` rather than declared on
 * `TextProps` directly (Global Constraint: vocabulary axis props come from
 * the builder, not the recipe's own prop type); `getStyles('root')` already
 * stamps `data-size` from it. All five generic params are supplied
 * explicitly (TOwnProps, TDefaultAs, TSelectors, TVariants, TVocabAxes):
 * Container.tsx's proven pattern for defineComponent's four generics, here
 * carried over to definePolymorphicComponent's five, since inference alone
 * has been observed to silently drop the vocabulary-axis typing.
 */
export const Text = definePolymorphicComponent<
  TextProps,
  'p',
  readonly ['root'],
  readonly [],
  readonly ['size']
>({
  name: 'Text',
  defaultElement: 'p',
  vocabularyAxes: ['size'] as const,
  selectors: ['root'] as const,
  classes,
  defaults: { size: 'md' },
  vars: (_theme, props) => {
    const size = (props as { size?: string }).size ?? 'md';
    return {
      root: {
        '--sb-text-fz': getFontSize(size) ?? '',
        '--sb-text-lh': getLineHeight(size) ?? '',
      },
    };
  },
  render: ({ Element, props, getStyles, ref }) => {
    // Vocabulary axis props (size) are NOT stripped by the builder before
    // render (only `as` is) and getStyles('root') already emits data-size,
    // so it's destructured out here rather than spread onto the DOM.
    // classNames/styles/vars/attributes/unstyled are the Styles API's own
    // config surface (consumed internally by useStyles via config.*, not by
    // getStyles's return value) and are not valid DOM attributes either, so
    // they're stripped the same way Box.tsx strips them.
    const {
      size: _size,
      dimmed,
      truncate,
      children,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as TextProps & Record<string, unknown>;
    return (
      <Element
        ref={ref}
        {...rest}
        data-dimmed={dimmed ? 'true' : undefined}
        data-truncate={truncate ? 'true' : undefined}
        {...getStyles('root')}
      >
        {children}
      </Element>
    );
  },
});

export const textTheme = Text.extend({});
