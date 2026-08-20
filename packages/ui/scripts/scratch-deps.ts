/**
 * Derives the scratch project's `dependencies` map from the registry items
 * the smoke check installs, rather than hardcoding it. The hardcoded map it
 * replaces (react, react-dom, @soribashi/core) happened to be correct only
 * because every SMOKE_ITEMS entry needed core alone; generate-registry.ts
 * already emits `@base-ui/react` for any item whose source imports Base UI.
 *
 * Deriving also pins external dependencies to the range packages/ui itself
 * uses, instead of leaving the version to whatever the shadcn CLI resolves.
 */

/**
 * Soribashi packages the smoke vendors into scratchDir/vendor/<name>. One
 * entry since the four framework packages merged into @soribashi/core; still a
 * Set rather than an equality check, so an OPTIONAL @soribashi/* sibling
 * joining the story later is a one-line change here, not a rewrite.
 */
const VENDORED = new Set(['@soribashi/core']);

/** React and its DOM binding are the scaffold's own, not any item's. */
const SCAFFOLD_DEPS: Record<string, string> = { react: '^19.2', 'react-dom': '^19.2' };

export function buildScratchDependencies(
  items: ReadonlyArray<{ name: string; dependencies: string[] }>,
  uiPackageDeps: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...SCAFFOLD_DEPS };

  for (const item of items) {
    for (const dep of item.dependencies) {
      if (dep.startsWith('@soribashi/')) {
        if (!VENDORED.has(dep)) {
          throw new Error(
            `[registry-smoke] registry item "${item.name}" declares dependency "${dep}", ` +
              'which is not among the vendored soribashi packages ' +
              `(${[...VENDORED].join(', ')}). Vendor it in writeScaffold or fix the item.`,
          );
        }
        // core is hoisted into the scratch project's own node_modules: it is
        // what a vendored recipe's `from '@soribashi/core'` import resolves
        // against. A future optional sibling would only need hoisting if a
        // recipe imported it directly, hence the explicit name test.
        if (dep === '@soribashi/core') out[dep] = 'file:./vendor/core';
        continue;
      }
      const pinned = uiPackageDeps[dep];
      if (!pinned) {
        throw new Error(
          `[registry-smoke] registry item "${item.name}" declares external dependency ` +
            `"${dep}", which packages/ui/package.json does not itself depend on. The registry ` +
            'advertises a dependency the library does not use: fix generate-registry.ts or the ' +
            'recipe, do not paper over it here.',
        );
      }
      out[dep] = pinned;
    }
  }

  return out;
}
