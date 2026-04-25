import { describe, expect, it } from 'vitest';
import { defaultTokens, defaultDarkTokens } from '../src/tokens/index.ts';

describe('defaultTokens', () => {
  it('includes a primary color scale with 50–900 shades', () => {
    expect(defaultTokens.colors.primary).toBeDefined();
    expect(defaultTokens.colors.primary?.['50']).toBeDefined();
    expect(defaultTokens.colors.primary?.['500']).toBeDefined();
    expect(defaultTokens.colors.primary?.['900']).toBeDefined();
  });

  it('includes radius scale with sm, md, lg', () => {
    expect(defaultTokens.radius.sm).toBeDefined();
    expect(defaultTokens.radius.md).toBeDefined();
    expect(defaultTokens.radius.lg).toBeDefined();
  });

  it('includes spacing scale with xs through xl', () => {
    expect(defaultTokens.spacing.xs).toBeDefined();
    expect(defaultTokens.spacing.sm).toBeDefined();
    expect(defaultTokens.spacing.md).toBeDefined();
    expect(defaultTokens.spacing.lg).toBeDefined();
    expect(defaultTokens.spacing.xl).toBeDefined();
  });

  it('includes font size scale with sm through xl', () => {
    expect(defaultTokens.fontSize.sm).toBeDefined();
    expect(defaultTokens.fontSize.md).toBeDefined();
    expect(defaultTokens.fontSize.lg).toBeDefined();
    expect(defaultTokens.fontSize.xl).toBeDefined();
  });

  it('includes neutral, success, danger, warning, info color families', () => {
    expect(defaultTokens.colors.neutral).toBeDefined();
    expect(defaultTokens.colors.success).toBeDefined();
    expect(defaultTokens.colors.danger).toBeDefined();
    expect(defaultTokens.colors.warning).toBeDefined();
    expect(defaultTokens.colors.info).toBeDefined();
  });

  it('defaultDarkTokens overrides primary and neutral colors', () => {
    expect(defaultDarkTokens.colors?.primary).toBeDefined();
    expect(defaultDarkTokens.colors?.neutral).toBeDefined();
  });
});
