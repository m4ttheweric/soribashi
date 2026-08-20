import { describe, expectTypeOf, it } from 'vitest';
import { defaultIntentResolver } from '../../src/theme/default-intent-resolver.ts';
import type { IntentResolver, IntentResolverInput, ResolvedTheme } from '../../src/theme/types.ts';

// SORI-8: `theme` used to be required on IntentResolverInput, so the natural
// resolver unit test — call it with the two values it actually reads — did not
// typecheck, and every test had to build a whole ResolvedTheme to satisfy it.
// These assertions are compile-time only; `bun run typecheck` is the gate.
describe('IntentResolverInput.theme is optional', () => {
  it('a resolver can be called with just intent and variant', () => {
    const result = defaultIntentResolver({ intent: 'primary', variant: 'filled' });
    expectTypeOf(result.background).toEqualTypeOf<string>();
  });

  it('a custom resolver typechecks without the theme argument', () => {
    const custom: IntentResolver = ({ intent, variant }) => ({
      background: `${intent}-${variant}`,
      color: 'white',
      border: 'transparent',
    });

    expectTypeOf(custom({ intent: 'brand', variant: 'outline' })).not.toBeNever();
  });

  it('a resolver that does consult the theme must narrow it', () => {
    const deriving: IntentResolver = ({ intent, theme }) => {
      expectTypeOf(theme).toEqualTypeOf<ResolvedTheme | undefined>();
      const scale = theme?.tokens.colors[intent];
      return { background: scale?.['500'] ?? 'transparent', color: 'inherit', border: 'none' };
    };

    expectTypeOf(deriving).toEqualTypeOf<IntentResolver>();
  });

  it('passing a theme is still accepted', () => {
    expectTypeOf<IntentResolverInput['theme']>().toEqualTypeOf<ResolvedTheme | undefined>();
  });
});
