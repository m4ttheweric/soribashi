import type { ResolvedTheme } from '@soribashi/theme';

/**
 * Emits visibility utility classes, soribashi's equivalents of Mantine's
 * mantine-hidden-from-*, mantine-visible-from-*, mantine-light-hidden, and
 * mantine-dark-hidden, driven by the theme's breakpoint tokens and dark-mode
 * selector instead of a hardcoded stylesheet.
 *
 * Every builder (factory's style-prop engine) already emits these class
 * names on the root slot for `hiddenFrom` / `visibleFrom` / `lightHidden` /
 * `darkHidden` props; this module supplies the CSS that defines them.
 *
 * `!important` on every display declaration: these utilities must beat both
 * recipe CSS (soribashi.recipes, normal-priority declarations) and inline
 * style props (unlayered, and would otherwise outrank any layered author
 * rule regardless of the @layer order).
 *
 * Breakpoint values are interpolated raw into the media queries: media query
 * conditions cannot contain `var()` (custom properties only substitute at
 * value-computation time, which @media conditions never reach), so this
 * reads `theme.tokens.breakpoint` directly rather than emitting a `var(...)`
 * reference the way the :root token declarations do.
 *
 * Deliberately reads the theme handed in, NOT a `removeDefaultVariables`-deduped
 * copy. Dedup only makes sense for custom-property declarations, whose value
 * is skippable when a `var()` reference already resolves to the default via
 * inheritance. A media query has no such fallback: a breakpoint that happens
 * to match the default still needs its `.sb-hidden-from-*` rule emitted, or
 * that utility silently stops working whenever dedup is enabled.
 *
 * Adapted from: packages/blocks/src/Box/visibility.css (itself adapted from
 * @mantine/core's global.css). That file remains in place until slice-2's
 * task 9 deletes the blocks package; identical duplicate rules across the
 * two sources are harmless.
 * License: MIT, see THIRD-PARTY-LICENSES.md at repo root
 */
export function emitVisibilityUtilities(theme: ResolvedTheme): string[] {
  const blocks: string[] = [];
  const breakpoints = Object.entries(theme.tokens.breakpoint ?? {}).sort(byKey);

  // hidden-from-*: element is hidden AT AND ABOVE the given breakpoint
  for (const [key, value] of breakpoints) {
    blocks.push(
      `@media (min-width: ${value}) {`,
      `  .sb-hidden-from-${key} {`,
      '    display: none !important;',
      '  }',
      '}',
      '',
    );
  }

  // visible-from-*: element is hidden BELOW the given breakpoint
  for (const [key, value] of breakpoints) {
    blocks.push(
      `@media (max-width: calc(${value} - 0.02px)) {`,
      `  .sb-visible-from-${key} {`,
      '    display: none !important;',
      '  }',
      '}',
      '',
    );
  }

  const darkSelector = theme.darkMode.selector;

  // light/dark scheme hidden helpers. System preference (prefers-color-scheme)
  // and an explicit dark-mode selector both flip the same class, so either
  // mechanism works regardless of which one a consuming app wires up.
  blocks.push(
    '.sb-light-hidden {',
    '  display: none !important;',
    '}',
    '',
    '@media (prefers-color-scheme: dark) {',
    '  .sb-light-hidden {',
    '    display: revert !important;',
    '  }',
    '}',
    '',
    `${darkSelector} .sb-light-hidden {`,
    '  display: revert !important;',
    '}',
    '',
    '.sb-dark-hidden {',
    '  display: revert !important;',
    '}',
    '',
    '@media (prefers-color-scheme: dark) {',
    '  .sb-dark-hidden {',
    '    display: none !important;',
    '  }',
    '}',
    '',
    `${darkSelector} .sb-dark-hidden {`,
    '  display: none !important;',
    '}',
  );

  return blocks;
}

function byKey([a]: [string, unknown], [b]: [string, unknown]): number {
  return a.localeCompare(b);
}
