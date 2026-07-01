/**
 * Type tests for phase 2 goal 4 — DefineGenericComponentConfig gets real types:
 * getStyles typed against `selectors`, vars slot-keyed, defaults variant
 * checked against the variants tuple. The author-supplied call-signature
 * pattern (Wave 4A) is untouched; when TSignature is passed explicitly the
 * other params fall back to defaults (TS has no partial inference), so authors
 * on that path annotate the render ctx with GenericRenderCtx instead.
 */
import { describe, expectTypeOf, it } from 'vitest';
import { type GenericRenderCtx, defineGenericComponent } from '../src/define-generic-component.tsx';

describe('goal 4 — getStyles typed against selectors', () => {
  it('rejects selector typos when type params are fully inferred', () => {
    defineGenericComponent({
      name: 'GenTypo',
      selectors: ['trigger', 'dropdown'] as const,
      render: ({ getStyles }) => {
        const ok = getStyles('trigger');
        void ok;
        // @ts-expect-error — 'tirgger' is not a declared selector
        const bad = getStyles('tirgger');
        void bad;
        return null;
      },
    });
  });

  it('rejects selector typos via GenericRenderCtx annotation (explicit-TSignature path)', () => {
    type Signature = (props: { data: string[] }) => React.ReactElement | null;
    const selectors = ['trigger', 'dropdown'] as const;
    defineGenericComponent<Signature>({
      name: 'GenAnnotated',
      selectors,
      render: ({ getStyles }: GenericRenderCtx<typeof selectors>) => {
        const ok = getStyles('dropdown');
        void ok;
        // @ts-expect-error — 'dropdwn' is not a declared selector
        const bad = getStyles('dropdwn');
        void bad;
        return null;
      },
    });
  });
});

describe('goal 4 — vars slot-keyed', () => {
  it('rejects vars slot typos when type params are inferred', () => {
    defineGenericComponent({
      name: 'GenVars',
      selectors: ['trigger'] as const,
      // @ts-expect-error — 'tirgger' is not a declared selector
      vars: () => ({ tirgger: { '--x': 'y' } }),
      render: () => null,
    });
    defineGenericComponent({
      name: 'GenVarsOk',
      selectors: ['trigger'] as const,
      vars: () => ({ trigger: { '--x': 'y' } }),
      render: () => null,
    });
  });
});

describe('goal 4 — defaults variant checked against the variants tuple', () => {
  it('rejects a defaults variant typo', () => {
    defineGenericComponent({
      name: 'GenDefaults',
      selectors: ['root'] as const,
      variants: ['dot', 'pill'] as const,
      // @ts-expect-error — 'square' is not in the variants tuple
      defaults: { variant: 'square' },
      render: () => null,
    });
    defineGenericComponent({
      name: 'GenDefaultsOk',
      selectors: ['root'] as const,
      variants: ['dot', 'pill'] as const,
      defaults: { variant: 'dot', anythingElse: 1 },
      render: () => null,
    });
  });
});

describe('goal 4 — render ctx shape', () => {
  it('exposes typed getStyles and untyped props (TSignature owns call-site props)', () => {
    type Ctx = GenericRenderCtx<readonly ['root']>;
    expectTypeOf<Parameters<Ctx['getStyles']>[0]>().toEqualTypeOf<'root'>();
  });
});
