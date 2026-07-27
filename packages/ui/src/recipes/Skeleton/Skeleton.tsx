import type { CSSProperties, Ref } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Skeleton.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

export interface SkeletonProps {
  /**
   * Inline-size, forwarded straight onto the root's `style`. No recipe-owned
   * size vocabulary: a loading placeholder needs to match whatever real
   * content it stands in for (a line of text, an avatar circle, a card), a
   * shape no fixed size tuple could anticipate, so geometry is entirely the
   * consumer's: `<Skeleton w={200} h={16} />`.
   */
  w?: CSSProperties['width'];
  /** Block-size, forwarded straight onto the root's `style`. See `w`. */
  h?: CSSProperties['height'];
}

export const Skeleton = defineComponent<SkeletonProps, readonly ['root']>({
  name: 'Skeleton',
  selectors: ['root'] as const,
  classes,
  render: ({ props, getStyles, ref }) => {
    // w/h are this recipe's own geometry props, merged into getStyles('root')'s
    // own `style` option rather than forwarded as DOM attributes.
    // classNames/styles/vars/attributes/unstyled are the Styles API's own
    // config surface, not valid DOM attributes, and are stripped the same way
    // every other recipe in this package strips them.
    const {
      w,
      h,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as SkeletonProps & Record<string, unknown>;

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        // Purely decorative: a Skeleton stands in for content that has not
        // arrived yet, and renders no text of its own for assistive tech to
        // announce, so it is hidden outright rather than given a role/label.
        aria-hidden="true"
        {...rest}
        {...getStyles('root', { style: { inlineSize: w, blockSize: h } })}
      />
    );
  },
});

export const skeletonTheme = Skeleton.extend({});
