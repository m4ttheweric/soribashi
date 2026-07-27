import type { Ref } from 'react';
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

/**
 * No recipe-owned props: geometry is entirely the consumer's, via the
 * universal `w`/`h` style props every recipe gets for free from the builder
 * (see the authoring skill's "style props and visibility props arrive free"
 * section) -- `<Skeleton w={200} h={16} />`, or the responsive object form,
 * `<Skeleton w={{ base: '100%', md: 200 }} />`.
 *
 * Fix-wave Important 2: this interface used to redeclare `w`/`h` itself
 * (`w?: CSSProperties['width']`), which was dead in two ways at once. First,
 * `w`/`h` are `STYLE_PROPS_DATA` keys, and `useStyleProps` (called inside
 * every builder, before `render` ever runs) strips every style prop off
 * `props` before this recipe's `render` receives them -- so the destructured
 * `w`/`h` below were always `undefined`, and the `getStyles('root', { style:
 * { inlineSize: w, blockSize: h } })` call that read them never actually set
 * anything. The real geometry flowed through the universal style-props
 * pipeline the whole time (`w`/`h` resolve to `width`/`height` via
 * `getSpacing`, not `inlineSize`/`blockSize`). Second, the explicit
 * `w?: CSSProperties['width']` declaration REGRESSED the type surface: it
 * intersected against `UniversalStyleProps`' own `w?: StyleProp<string |
 * number>`, and since `CSSProperties['width']` is not the responsive-object
 * shape `StyleProp<T>` also accepts, the intersection narrowed the combined
 * type down to the non-responsive form only -- silently dropping
 * `w={{ base, md }}` support that works at runtime for every other recipe.
 */
export const Skeleton = defineComponent<Record<never, never>, readonly ['root']>({
  name: 'Skeleton',
  selectors: ['root'] as const,
  classes,
  render: ({ props, getStyles, ref }) => {
    // classNames/styles/vars/attributes/unstyled are the Styles API's own
    // config surface, not valid DOM attributes, and are stripped the same way
    // every other recipe in this package strips them. No w/h destructure here
    // (see the module doc comment above): the builder's own useStyleProps
    // pipeline already extracted and applied them to getStyles('root')'s
    // returned className/style before render ever saw props.
    const {
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as Record<string, unknown>;

    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        // Purely decorative: a Skeleton stands in for content that has not
        // arrived yet, and renders no text of its own for assistive tech to
        // announce, so it is hidden outright rather than given a role/label.
        aria-hidden="true"
        {...rest}
        {...getStyles('root')}
      />
    );
  },
});

export const skeletonTheme = Skeleton.extend({});
