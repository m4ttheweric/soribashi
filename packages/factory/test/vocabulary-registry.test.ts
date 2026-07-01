import { defineVocabulary } from '@soribashi/theme';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  registerComponentVocabularies,
  resetRegistry,
  resolveVocab,
} from '../src/vocabulary-registry.ts';

describe('vocabulary-registry', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('returns undefined when no registration exists', () => {
    expect(resolveVocab('UnknownComponent', 'size')).toBeUndefined();
  });

  it('returns registered vocabulary for the right axis', () => {
    const sizeVocab = defineVocabulary(['small', 'large']);
    registerComponentVocabularies('Button', { size: sizeVocab });
    expect(resolveVocab('Button', 'size')).toBe(sizeVocab);
    expect(resolveVocab('Button', 'intent')).toBeUndefined();
  });

  it('falls back to the global vocab when no per-component registration exists', () => {
    const globalIntent = defineVocabulary(['safe', 'critical']);
    registerComponentVocabularies('__global__', { intent: globalIntent });
    expect(resolveVocab('Button', 'intent')).toBe(globalIntent);
  });

  it('per-component vocab beats the global vocab', () => {
    const globalSize = defineVocabulary(['xs', 'md', 'xl']);
    const buttonSize = defineVocabulary(['small', 'large']);
    registerComponentVocabularies('__global__', { size: globalSize });
    registerComponentVocabularies('Button', { size: buttonSize });
    expect(resolveVocab('Button', 'size')).toBe(buttonSize);
    expect(resolveVocab('OtherComponent', 'size')).toBe(globalSize);
  });
});
