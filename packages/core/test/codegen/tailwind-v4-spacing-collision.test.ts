import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, it, vi } from 'vitest';
import { emitTailwindV4 } from '../../src/codegen/emit-tailwind-v4.ts';
import { createTheme } from '../../src/theme/index.ts';

/**
 * Regression cover for the `--spacing-*` / `--container-*` collision.
 *
 * Tailwind v4 resolves the sizing utilities (`max-w-`, `w-`, `min-w-`, `size-`,
 * `basis-`) from `--spacing-*` before `--container-*`, and `--spacing-*` wins
 * unconditionally — re-declaring `--container-*` afterwards does not help, and
 * neither does `--spacing-*: initial`. So emitting a theme spacing key named
 * `sm` silently redefined `max-w-sm` from 24rem to 0.5rem.
 *
 * Unlike tailwind-v4-e2e.test.ts, these cases import real Tailwind so its
 * default `--container-*` scale is present. Without that import there is
 * nothing for `--spacing-*` to shadow and the bug cannot reproduce.
 */

const require = createRequire(import.meta.url);
const TW_INDEX = require.resolve('tailwindcss/index.css');

async function build(themeBlock: string, candidates: string[]): Promise<string> {
  const compiler = await compile(`@import "tailwindcss";\n${themeBlock}`, {
    base: dirname(TW_INDEX),
    async loadStylesheet(id: string, base: string) {
      const file = id === 'tailwindcss' ? TW_INDEX : resolve(base, id);
      return { path: file, base: dirname(file), content: readFileSync(file, 'utf8') };
    },
  });
  return compiler.build(candidates);
}

function declarationsFor(css: string, utility: string): string {
  const escaped = utility.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
  const match = css.match(new RegExp(`\\.${escaped}\\s*\\{([^}]*)\\}`));
  return match?.[1] ? match[1].trim().replace(/\s+/g, ' ') : '';
}

const themeWith = (spacing: Record<string, string>) =>
  createTheme({
    tokens: {
      colors: { primary: { '500': 'hsl(217 91% 60%)' } },
      radius: {},
      spacing,
      fontSize: {},
    },
  });

const SIZING = ['max-w-sm', 'w-sm', 'min-w-sm', 'basis-sm', 'size-md'];

describe('emitTailwindV4 — spacing/container collision', () => {
  it("default 'safe' mode leaves the sizing utilities on Tailwind's container scale", async () => {
    const css = await build(emitTailwindV4(themeWith({ sm: '0.5rem', md: '0.75rem' })), [
      ...SIZING,
      'p-sm',
    ]);

    expect(declarationsFor(css, 'max-w-sm')).toBe('max-width: var(--container-sm);');
    expect(declarationsFor(css, 'w-sm')).toBe('width: var(--container-sm);');
    expect(declarationsFor(css, 'min-w-sm')).toBe('min-width: var(--container-sm);');
    expect(declarationsFor(css, 'basis-sm')).toBe('flex-basis: var(--container-sm);');
    // No --spacing-md, so `size-md` has nothing to resolve against.
    expect(declarationsFor(css, 'size-md')).toBe('');
    expect(declarationsFor(css, 'p-sm')).toBe('');
  });

  it('withholds only the colliding keys; other spacing keys still make utilities', async () => {
    const emitted = emitTailwindV4(themeWith({ sm: '0.5rem', cozy: '0.75rem' }));

    expect(emitted).toContain('--spacing-cozy: 0.75rem;');
    expect(emitted).not.toContain('--spacing-sm:');

    const css = await build(emitted, ['p-cozy', 'gap-cozy', 'max-w-sm']);
    expect(declarationsFor(css, 'p-cozy')).toBe('padding: var(--spacing-cozy);');
    expect(declarationsFor(css, 'gap-cozy')).toBe('gap: var(--spacing-cozy);');
    expect(declarationsFor(css, 'max-w-sm')).toBe('max-width: var(--container-sm);');
  });

  it('names the withheld keys in the generated file so the omission is discoverable', () => {
    const emitted = emitTailwindV4(themeWith({ sm: '0.5rem', md: '0.75rem', cozy: '1rem' }));

    expect(emitted).toContain('Withheld from --spacing-*: md, sm');
    expect(emitted).toContain("spacingUtilities: 'all'");
    // The comment sits inside @theme, which Tailwind must still parse.
    expect(emitted).toContain('@theme {');
  });

  it("'all' mode emits everything and shadows the container scale, as documented", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const emitted = emitTailwindV4(themeWith({ sm: '0.5rem', md: '0.75rem' }), {
      spacingUtilities: 'all',
    });
    warn.mockRestore();

    expect(emitted).toContain('--spacing-sm: 0.5rem;');

    const css = await build(emitted, [...SIZING, 'p-sm']);
    expect(declarationsFor(css, 'p-sm')).toBe('padding: var(--spacing-sm);');
    // The documented cost of opting in.
    expect(declarationsFor(css, 'max-w-sm')).toBe('max-width: var(--spacing-sm);');
    expect(declarationsFor(css, 'size-md')).toBe(
      'width: var(--spacing-md); height: var(--spacing-md);',
    );
  });

  it("'all' mode warns, naming the keys and the utilities it breaks", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitTailwindV4(themeWith({ sm: '0.5rem', md: '0.75rem' }), { spacingUtilities: 'all' });

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain('md, sm');
    expect(message).toContain('max-w-');
    warn.mockRestore();
  });

  it('stays quiet on the safe path (no console noise for the correct default)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitTailwindV4(themeWith({ sm: '0.5rem', cozy: '1rem' }));
    emitTailwindV4(themeWith({ cozy: '1rem' }));

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('re-declaring --container-* cannot undo the shadowing (why the fix is emitter-side)', async () => {
    const css = await build('@theme {\n  --spacing-sm: 0.5rem;\n  --container-sm: 24rem;\n}', [
      'max-w-sm',
    ]);

    // Documents the constraint that rules out "just emit a container scale too".
    expect(declarationsFor(css, 'max-w-sm')).toBe('max-width: var(--spacing-sm);');
  });
});
