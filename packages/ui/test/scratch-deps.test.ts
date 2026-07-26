import { describe, expect, it } from 'vitest';
import { buildScratchDependencies } from '../scripts/scratch-deps.ts';

const UI_DEPS = { '@base-ui/react': '^1.6.0', react: '^19.2', 'react-dom': '^19.2' };

describe('buildScratchDependencies', () => {
  it('reproduces the previously hardcoded map for core-only items', () => {
    expect(
      buildScratchDependencies(
        [
          { name: 'button', dependencies: ['@soribashi/core'] },
          { name: 'stack', dependencies: ['@soribashi/core'] },
        ],
        UI_DEPS,
      ),
    ).toEqual({
      react: '^19.2',
      'react-dom': '^19.2',
      '@soribashi/core': 'file:./vendor/core',
    });
  });

  it('adds an external dependency at the range packages/ui pins for it', () => {
    const deps = buildScratchDependencies(
      [{ name: 'checkbox', dependencies: ['@soribashi/core', '@base-ui/react'] }],
      UI_DEPS,
    );
    expect(deps['@base-ui/react']).toBe('^1.6.0');
    expect(deps['@soribashi/core']).toBe('file:./vendor/core');
  });

  it('dedupes a dependency shared by two items', () => {
    const deps = buildScratchDependencies(
      [
        { name: 'checkbox', dependencies: ['@soribashi/core', '@base-ui/react'] },
        { name: 'tabs', dependencies: ['@soribashi/core', '@base-ui/react'] },
      ],
      UI_DEPS,
    );
    expect(Object.keys(deps).sort()).toEqual([
      '@base-ui/react',
      '@soribashi/core',
      'react',
      'react-dom',
    ]);
  });

  it('fails loudly, naming item and dependency, for a soribashi package that is not vendored', () => {
    expect(() =>
      buildScratchDependencies([{ name: 'button', dependencies: ['@soribashi/nope'] }], UI_DEPS),
    ).toThrow(/button.*@soribashi\/nope.*vendor/s);
  });

  it('fails loudly for an external dependency packages/ui does not itself pin', () => {
    expect(() =>
      buildScratchDependencies([{ name: 'button', dependencies: ['lodash'] }], UI_DEPS),
    ).toThrow(/button.*lodash.*packages\/ui\/package\.json/s);
  });
});
