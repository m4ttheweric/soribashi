import { describe, expect, it } from 'vitest';
import { emitLayerDeclaration } from '../../src/codegen/emit-layer.ts';

describe('emitLayerDeclaration', () => {
  it('declares tokens, then recipes, then utilities', () => {
    expect(emitLayerDeclaration()).toBe(
      '@layer soribashi.tokens, soribashi.recipes, soribashi.utilities;\n',
    );
  });
});
