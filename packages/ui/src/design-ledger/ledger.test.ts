import { describe, expect, it } from 'vitest';
import { uiTheme } from '../theme.ts';
import { toleranceOf } from './ledger.ts';
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

describe('toleranceOf', () => {
  it('returns the declared tolerance of a row that has one', () => {
    expect(toleranceOf('controls.sharedHeight')).toBe(0.5);
  });

  it('returns 0 for a row that declares none (tolerating nothing is the default)', () => {
    expect(toleranceOf('switch.thumb.centered')).toBe(0);
  });

  it('throws on an unknown row id rather than silently tolerating 0 of nothing', () => {
    expect(() => toleranceOf('no.such.row')).toThrow("no ledger row 'no.such.row'");
  });
});

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
