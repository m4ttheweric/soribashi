import { describe, expect, it } from 'vitest';
import { buildManifest } from '../scripts/derive.ts';
import { MATRIX_CLASSIFICATION, SMALL_COVERAGE_NAMES } from '../src/a11y/matrix-classification.ts';

/**
 * Node-tier guard over `matrix-classification.ts` (see that file's doc
 * comment for why the split exists). Builds the manifest in memory via
 * `buildManifest()` (same in-memory pattern as manifest-drift.test.ts) so
 * this stays correct as recipes are added, rather than hardcoding a recipe
 * list here.
 */

const COLOR_TOKEN_RE = /--(color|text|surface|accent)-/;

describe('contrast matrix classification guard', () => {
  it('every manifest recipe has a MATRIX_CLASSIFICATION entry', async () => {
    const manifest = await buildManifest();
    const missing = manifest.recipes
      .map((recipe) => recipe.name)
      .filter((name) => !(name in MATRIX_CLASSIFICATION));

    expect(
      missing,
      missing.length === 0
        ? undefined
        : `Missing MATRIX_CLASSIFICATION entries for: ${missing.join(', ')}. Add each to ` +
            "packages/ui/src/a11y/matrix-classification.ts, either 'covered' (with a rendered " +
            "cell: Button's grid or a SMALL_COVERAGE entry in " +
            "packages/ui/src/a11y/contrast-matrix.test.tsx) or { exempt: '<reason>' }.",
    ).toEqual([]);
  });

  it("every 'covered' classification is 'Button' or a name in SMALL_COVERAGE_NAMES", () => {
    const invalid = Object.entries(MATRIX_CLASSIFICATION)
      .filter(([, classification]) => classification === 'covered')
      .map(([name]) => name)
      .filter((name) => name !== 'Button' && !SMALL_COVERAGE_NAMES.includes(name));

    expect(
      invalid,
      invalid.length === 0
        ? undefined
        : `These recipes are classified 'covered' in packages/ui/src/a11y/matrix-classification.ts ` +
            `but render no contrast cells: ${invalid.join(', ')}. Either add a SMALL_COVERAGE entry ` +
            'for each in packages/ui/src/a11y/contrast-matrix.test.tsx (and list it in ' +
            "SMALL_COVERAGE_NAMES), or reclassify as { exempt: '<reason>' } in " +
            'packages/ui/src/a11y/matrix-classification.ts.',
    ).toEqual([]);
  });

  it(
    "advisory: every {exempt} recipe with colour-bearing tokenDependencies states 'colour-via:' " +
      'in its exemption reason',
    async () => {
      // Mechanical check, not a colour-correctness check: a recipe classified
      // `{ exempt }` whose stylesheet still depends on a colour-family token
      // (matching /--(color|text|surface|accent)-/) is a recipe that DOES
      // render colour somewhere, so its exemption reason must say where the
      // colour-contrast proof actually lives (a `colour-via:` prefix pointing
      // at whatever other test covers it), rather than silently opting the
      // whole recipe out of contrast checking. This only reports; it never
      // fails on `'covered'` recipes, which have real rendered cells instead
      // of a text-based exemption reason.
      const manifest = await buildManifest();
      const byName = new Map(manifest.recipes.map((recipe) => [recipe.name, recipe]));

      const unacknowledged: string[] = [];
      for (const [name, classification] of Object.entries(MATRIX_CLASSIFICATION)) {
        if (classification === 'covered') continue;
        const recipe = byName.get(name);
        if (!recipe) continue; // absent-from-manifest is the first test's failure, not this one.
        const hasColorDeps = recipe.tokenDependencies.some((dep) => COLOR_TOKEN_RE.test(dep));
        if (hasColorDeps && !classification.exempt.startsWith('colour-via:')) {
          unacknowledged.push(`${name}: "${classification.exempt}"`);
        }
      }

      expect(
        unacknowledged,
        unacknowledged.length === 0
          ? undefined
          : 'These exempt recipes depend on colour-family tokens but their exemption reason does ' +
              "not start with 'colour-via:', so it does not point at where their colour-contrast " +
              'proof lives. Update the entry in packages/ui/src/a11y/matrix-classification.ts: ' +
              unacknowledged.join('; '),
      ).toEqual([]);
    },
  );
});
