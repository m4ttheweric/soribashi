// `@soribashi/core/testing` (not this narrower path) also re-exports
// matrix-harness.tsx, which imports `vitest-browser-react/pure` — a module
// that throws at import time outside Vitest Browser Mode. This file is
// reached by node-tier tests (contrast-math.test.ts), so it must resolve
// only the pure-math module, never the barrel.
export * from '@soribashi/core/testing/contrast';
