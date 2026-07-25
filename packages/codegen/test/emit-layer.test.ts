import { describe, expect, it } from 'vitest';
import { emitLayerDeclaration } from '../src/emit-layer.ts';

describe('emitLayerDeclaration', () => {
  it('declares tokens before recipes so recipes can override tokens', () => {
    expect(emitLayerDeclaration()).toBe('@layer soribashi.tokens, soribashi.recipes;\n');
  });
});
