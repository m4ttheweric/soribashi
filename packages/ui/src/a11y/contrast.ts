// `@soribashi/core/testing` (not this narrower path) also re-exports
// matrix-harness.tsx, which imports `vitest-browser-react/pure` — a module
// that throws at import time outside Vitest Browser Mode. This file is
// reached by node-tier tests (contrast-math.test.ts), so it must resolve
// only the pure-math module, never the barrel.
export * from '@soribashi/core/testing/contrast';

import { compositeOver, type RGBA } from '@soribashi/core/testing/contrast';

// compositeOver then integer-channel rounding: the ledger's floor rows compare
// against a real rendered colour, whose channels are 8-bit integers, not the
// continuous composite. Quantizing here is what makes those comparisons exact.
export function compositeOverQuantized(color: RGBA, backdrop: RGBA): RGBA {
  const c = compositeOver(color, backdrop);
  return { r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b), a: 1 };
}
