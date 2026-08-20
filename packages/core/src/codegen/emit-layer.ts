/**
 * Declares the cascade layer order up front, which is what fixes the order
 * regardless of where the rules themselves appear.
 *
 * Order: tokens, then recipes, then utilities. `soribashi.utilities` (see
 * emit-visibility.ts) is declared last so its rules win over
 * `soribashi.recipes` under normal cascade-layer priority; it additionally
 * marks every declaration `!important`, since layer order alone would still
 * lose to an unlayered inline style prop (inline styles aren't part of any
 * layer and outrank layered normal-priority rules regardless of order).
 *
 * Consumer styles are deliberately left UNLAYERED. Unlayered rules beat every
 * layered rule regardless of specificity, so a vendoring consumer's own class
 * always wins without !important or specificity games. That is the structural
 * replacement for tailwind-merge's last-wins resolution.
 */
export function emitLayerDeclaration(): string {
  return '@layer soribashi.tokens, soribashi.recipes, soribashi.utilities;\n';
}
