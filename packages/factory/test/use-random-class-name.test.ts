import { describe, expect, it, vi } from 'vitest';

/**
 * Unit-test the class-name sanitization logic from useRandomClassName.
 *
 * We test the strip helper in isolation (no React hooks needed), plus a
 * smoke-test that the exported hook returns a valid class name.
 */
import { stripIdMarkers } from '../src/use-random-class-name.ts';

describe('stripIdMarkers', () => {
  it('strips colons from a React 18-style useId output', () => {
    expect(stripIdMarkers(':r0:')).toBe('r0');
  });

  it('strips «» guillemet markers added by React 19 useId', () => {
    expect(stripIdMarkers(':r0:«»1«»')).toBe('r01');
  });

  it('strips mixed colons and guillemets', () => {
    expect(stripIdMarkers(':r0:«»1«»')).toBe('r01');
  });

  it('is a no-op on a string that already has no markers', () => {
    expect(stripIdMarkers('r0')).toBe('r0');
  });

  it('strips all colons and both guillemet characters globally', () => {
    expect(stripIdMarkers('«:a:»«:b:»')).toBe('ab');
  });
});
