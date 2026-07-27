import { describe, expect, it } from 'vitest';
import { uiTheme } from '../theme.ts';
import { REFERENCE } from './reference.ts';

function oklchLightness(value: string): number {
  const m = /oklch\(\s*([0-9.]+)/.exec(value);
  if (!m) throw new Error(`not an oklch value: ${value}`);
  return Number(m[1]);
}

function oklchAlpha(value: string): number {
  const m = /\/\s*([0-9.]+)\s*\)/.exec(value);
  return m ? Number(m[1]) : 1;
}

describe('design ledger: token rows', () => {
  it('dialog.scrim.effectiveDarkness', () => {
    const overlay = uiTheme.semanticTokens.surface.overlay as string;
    const darkness = oklchAlpha(overlay) * (1 - oklchLightness(overlay));
    const [lo, hi] = REFERENCE['dialog.scrim.effectiveDarkness']!.bound as readonly [
      number,
      number,
    ];
    expect(
      darkness >= lo && darkness <= hi,
      `scrim effective darkness ${darkness.toFixed(3)} outside [${lo}, ${hi}]`,
    ).toBe(true);
  });
});
