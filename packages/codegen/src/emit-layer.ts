/**
 * Declares the cascade layer order up front, which is what fixes the order
 * regardless of where the rules themselves appear.
 *
 * Consumer styles are deliberately left UNLAYERED. Unlayered rules beat every
 * layered rule regardless of specificity, so a vendoring consumer's own class
 * always wins without !important or specificity games. That is the structural
 * replacement for tailwind-merge's last-wins resolution.
 */
export function emitLayerDeclaration(): string {
  return '@layer soribashi.tokens, soribashi.recipes;\n';
}
