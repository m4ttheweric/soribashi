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

// Radix UI's Select (and other pointer-capture-driven primitives) call
// Element.hasPointerCapture / setPointerCapture / releasePointerCapture and
// Element.scrollIntoView on interaction. jsdom does not implement the pointer
// capture APIs and its scrollIntoView is a no-op stub only in newer versions,
// so both are polyfilled here for the test environment. The real
// implementation runs in the browser; these tests only assert structural
// behavior (portal mounting, className, open/close, selection callbacks).
if (typeof Element.prototype.hasPointerCapture === 'undefined') {
  Element.prototype.hasPointerCapture = () => false;
}
if (typeof Element.prototype.setPointerCapture === 'undefined') {
  Element.prototype.setPointerCapture = () => {};
}
if (typeof Element.prototype.releasePointerCapture === 'undefined') {
  Element.prototype.releasePointerCapture = () => {};
}
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}
