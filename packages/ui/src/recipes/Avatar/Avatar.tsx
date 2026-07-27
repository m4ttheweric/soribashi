import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import type { ReactNode, Ref } from 'react';
import { defineComponent } from '../../builders.ts';
import classes from './Avatar.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 1 = pure styled primitive (§ 2.1). Read by packages/ui/scripts/derive.ts to
 * build the agent-facing manifest; not itself derived, since it records an
 * authoring decision, not a fact recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 1 as const;

/**
 * Base UI's real avatar surface, enumerated from
 * node_modules/@base-ui/react/avatar/{index.parts,root/AvatarRoot,image/AvatarImage,
 * fallback/AvatarFallback,image/useImageLoadingStatus}.d.ts PLUS the compiled
 * `.mjs` sources (needed to answer exactly when each part mounts, which the
 * `.d.ts` files alone don't settle), not from memory:
 *
 * - Parts: `Avatar.Root` (a `<span>`, owns one piece of state --
 *   `imageLoadingStatus: 'idle' | 'loading' | 'loaded' | 'error'` -- in
 *   context), `Avatar.Image` (an `<img>`), `Avatar.Fallback` (a `<span>`).
 * - `Avatar.Root`'s `imageLoadingStatus` starts at `'idle'` and ONLY changes
 *   when a mounted `Avatar.Image` reports a status change; if no `Image` is
 *   ever rendered, it never leaves `'idle'`.
 * - `Avatar.Image` drives a real `window.Image()` load (see
 *   `useImageLoadingStatus`): `'loading'` the instant a `src` is set, then
 *   the browser's own `onload`/`onerror` flips it to `'loaded'`/`'error'`.
 *   It renders NOTHING (`return null`) until `imageLoadingStatus === 'loaded'`
 *   -- so "no img visible" is true for `'idle'`, `'loading'`, AND `'error'`
 *   alike, not just the error state specifically.
 * - `Avatar.Fallback` is enabled whenever `imageLoadingStatus !== 'loaded'`
 *   (with no `delay` prop, which this recipe never passes) -- i.e. it is
 *   visible for `'idle'`, `'loading'`, AND `'error'`, the same three states
 *   `Avatar.Image` stays unmounted for. The two parts are exact complements
 *   of each other keyed on the SAME status, never both visible at once.
 *
 * This recipe renders `Avatar.Image` only when `src` is actually provided:
 * an avatar with no photo has nothing to attempt loading, and (per the point
 * above) `Avatar.Root`'s `imageLoadingStatus` then simply stays at its
 * literal initial `'idle'` value forever, with no image request, no effect,
 * and no state transition ever involved -- the fallback renders from Base
 * UI's own initial state, not from a simulated error.
 */
export interface AvatarProps {
  /** Image URL. Omit entirely to render only the fallback. */
  src?: string;
  /** Forwarded to the underlying `<img>`. */
  alt?: string;
  /** Rendered whenever no image is loaded (no `src`, still loading, or the image failed). */
  fallback?: ReactNode;
}

/**
 * Sizes keyed on the ui theme's size vocabulary, following the
 * dimension-record pattern (Badge's BADGE_HEIGHTS, Checkbox's
 * CHECKBOX_SIZES). Lives in the recipe, not the framework, because
 * @soribashi/ui is a consumer and owns these values. Emits the all-lowercase
 * `--sb-avatar-size` custom property Avatar.module.css's `.root` rule
 * consumes for both dimensions, and `.fallback` derives its own font-size
 * from via `calc()`, so the whole control scales from this one variable.
 * No `intent` axis: an avatar has exactly one neutral surface treatment
 * regardless of intent (recorded decision -- this recipe declares only
 * `size`).
 */
const AVATAR_SIZES: Record<string, string> = {
  xs: '1.5rem',
  sm: '2rem',
  md: '2.5rem',
  lg: '3rem',
  xl: '4rem',
};

export const Avatar = defineComponent<
  AvatarProps,
  readonly ['root', 'image', 'fallback'],
  readonly [],
  readonly ['size']
>({
  name: 'Avatar',
  vocabularyAxes: ['size'] as const,
  selectors: ['root', 'image', 'fallback'] as const,
  classes,
  defaults: { size: 'md' },
  vars: (_theme, props) => {
    const p = props as { size?: string };
    const size = AVATAR_SIZES[p.size ?? 'md'] ?? AVATAR_SIZES.md!;
    return {
      root: { '--sb-avatar-size': size },
    };
  },
  render: ({ props, getStyles, ref }) => {
    // Vocabulary axis props (size) are NOT stripped by the builder before
    // render and getStyles('root') already emits data-size there, so it's
    // destructured out here rather than spread onto the DOM. src/alt/fallback
    // are this recipe's own props, consumed directly below instead of
    // forwarded onto Avatar.Root. classNames/styles/vars/attributes/unstyled
    // are the Styles API's own config surface, not valid DOM/Base-UI props,
    // and are stripped the same way every other recipe in this package
    // strips them.
    const {
      src,
      alt,
      fallback,
      size: _size,
      classNames: _classNames,
      styles: _styles,
      vars: _vars,
      attributes: _attributes,
      unstyled: _unstyled,
      ...rest
    } = props as AvatarProps & Record<string, unknown>;

    return (
      <BaseAvatar.Root ref={ref as Ref<HTMLElement>} {...rest} {...getStyles('root')}>
        {src != null ? <BaseAvatar.Image src={src} alt={alt} {...getStyles('image')} /> : null}
        {fallback != null ? (
          <BaseAvatar.Fallback {...getStyles('fallback')}>{fallback}</BaseAvatar.Fallback>
        ) : null}
      </BaseAvatar.Root>
    );
  },
});

export const avatarTheme = Avatar.extend({});
