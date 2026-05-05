import '@testing-library/jest-dom/vitest';

// ResizeObserver is used by Radix UI's Popper (for content sizing). jsdom
// does not implement it, so we provide a no-op stub for the test environment.
// The real implementation runs in the browser; these tests only assert
// structural behavior (portal mounting, className, CSS vars, open/close).
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
