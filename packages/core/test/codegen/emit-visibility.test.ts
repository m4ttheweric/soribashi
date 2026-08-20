import { describe, expect, it } from 'vitest';
import { emitVisibilityUtilities } from '../../src/codegen/emit-visibility.ts';
import { createTheme, defaultTokens } from '../../src/theme/index.ts';

describe('emitVisibilityUtilities', () => {
  it('emits .sb-hidden-from-<key> guarded by a min-width media query using the raw breakpoint value', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const out = emitVisibilityUtilities(theme).join('\n');
    expect(out).toContain('@media (min-width: 48rem)');
    expect(out).toContain('.sb-hidden-from-md {');
  });

  it('covers every breakpoint the theme declares, including 2xl and 3xl', () => {
    // The old blocks/Box/visibility.css stopped at xl: this is the gap task 3 closes.
    const theme = createTheme({ tokens: defaultTokens });
    const out = emitVisibilityUtilities(theme).join('\n');
    for (const [key, value] of Object.entries(defaultTokens.breakpoint ?? {})) {
      expect(out).toContain(`.sb-hidden-from-${key} {`);
      expect(out).toContain(`@media (min-width: ${value})`);
      expect(out).toContain(`.sb-visible-from-${key} {`);
      expect(out).toContain(`@media (max-width: calc(${value} - 0.02px))`);
    }
  });

  it('sb-visible-from-<key> hides BELOW the breakpoint via calc(value - 0.02px)', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const out = emitVisibilityUtilities(theme).join('\n');
    expect(out).toContain('@media (max-width: calc(48rem - 0.02px))');
    expect(out).toContain('.sb-visible-from-md {');
  });

  it('puts !important on every display declaration: utilities must beat recipe CSS and inline style props', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const out = emitVisibilityUtilities(theme);
    const displayLines = out.filter((line) => line.trim().startsWith('display:'));
    expect(displayLines.length).toBeGreaterThan(0);
    for (const line of displayLines) {
      expect(line).toContain('!important');
    }
  });

  it('emits sb-light-hidden and sb-dark-hidden reacting to the default .dark selector', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const out = emitVisibilityUtilities(theme).join('\n');
    expect(out).toContain('.sb-light-hidden {');
    expect(out).toContain('.sb-dark-hidden {');
    expect(out).toContain('.dark .sb-light-hidden {');
    expect(out).toContain('.dark .sb-dark-hidden {');
    // light-hidden: hidden in light, revert (visible) in dark
    expect(out).toContain(
      '@media (prefers-color-scheme: dark) {\n  .sb-light-hidden {\n    display: revert !important;',
    );
  });

  it('generalizes the dark selector from the theme, not a hardcoded .dark', () => {
    const theme = createTheme({
      tokens: defaultTokens,
      scope: '.app-scope',
      darkMode: { selector: '.dark .app-scope' },
    });
    const out = emitVisibilityUtilities(theme).join('\n');
    expect(out).toContain('.dark .app-scope .sb-light-hidden {');
    expect(out).toContain('.dark .app-scope .sb-dark-hidden {');
    expect(out).not.toContain('.dark .sb-light-hidden {');
    expect(out).not.toContain('.dark .sb-dark-hidden {');
  });

  it('sb-light-hidden and sb-dark-hidden are complementary: light-hidden defaults to none, dark-hidden defaults to revert', () => {
    const theme = createTheme({ tokens: defaultTokens });
    const out = emitVisibilityUtilities(theme).join('\n');
    const lightHiddenStart = out.indexOf('.sb-light-hidden {');
    const lightHiddenBlock = out.slice(lightHiddenStart, lightHiddenStart + 60);
    expect(lightHiddenBlock).toContain('display: none !important;');

    const darkHiddenStart = out.indexOf('.sb-dark-hidden {');
    const darkHiddenBlock = out.slice(darkHiddenStart, darkHiddenStart + 60);
    expect(darkHiddenBlock).toContain('display: revert !important;');
  });
});
