import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../manifest.json' with { type: 'json' };

/**
 * Closes the residual hole in the slot-key source: a key used by a
 * `getStyles({ part })` call or declared as a CSS-module class, but missing
 * from the recipe's declared `slotKeys` array, would produce a manifest that
 * lies about the recipe's stylable surface. Both halves are plain scans over
 * the real source shape. The earlier design's third half (parsing the TS
 * slot-key union out of source) is deliberately absent: under the const-array
 * convention the array IS the union.
 */
const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');

function recipeSource(name: string, ext: string): string {
  return readFileSync(
    join(REPO_ROOT, 'packages', 'ui', 'src', 'recipes', name, `${name}${ext}`),
    'utf-8',
  );
}

const COMPOUNDS = manifest.recipes.filter((r) => r.builder === 'defineCompound');

describe('compound slot keys', () => {
  it('has at least one compound to check', () => {
    expect(COMPOUNDS.length).toBeGreaterThan(0);
  });

  describe.each(COMPOUNDS.map((r) => [r.name, r] as const))('%s', (name, recipe) => {
    it("every getStyles({ part: '<key>' }) literal is a declared slot key", () => {
      const source = recipeSource(name, '.tsx');
      const used = [...source.matchAll(/part:\s*'([a-zA-Z0-9_-]+)'/g)].map((m) => m[1]!);
      expect(used.length, `no part: literals found in ${name}.tsx`).toBeGreaterThan(0);
      const undeclared = [...new Set(used)].filter((key) => !recipe.slots.includes(key));
      expect(
        undeclared,
        `${name}.tsx targets slot key(s) not in its declared slotKeys array: ${undeclared.join(', ')}`,
      ).toEqual([]);
    });

    it('every CSS-module class is a declared slot key', () => {
      const css = recipeSource(name, '.module.css');
      const classes = [...css.matchAll(/^\s*\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/gm)].map((m) => m[1]!);
      const undeclared = [...new Set(classes)].filter((key) => !recipe.slots.includes(key));
      expect(
        undeclared,
        `${name}.module.css declares class(es) with no matching slot key: ${undeclared.join(', ')}`,
      ).toEqual([]);
    });
  });
});
