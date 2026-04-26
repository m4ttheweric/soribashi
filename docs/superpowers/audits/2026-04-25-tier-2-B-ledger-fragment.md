# Tier 2 Batch T2-B — Ledger Fragment

**To be merged into `docs/superpowers/divergences/mantine-master.md` by the orchestrator in Phase 4.**

**Mantine commit:** `63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`
**Audit doc:** `docs/superpowers/audits/2026-04-25-tier-2-provider-types.md`

---

## Full audit pass — 2026-04-25 — Batch T2-B entries

### `provider.tsx` — pre-existing ledger entries confirmed

The following entries already exist in the master ledger and are confirmed correct by this pass:

- **"SoribashiProvider — minimal context-only provider"** — all 8 decision points (P1–P8) map to this entry. No changes needed.
- **"useTheme — falls back to default theme outside provider"** — C2, C3, UT2, UT3 all confirmed by this entry. No changes needed.

No new ledger entries for `provider.tsx`, `context.ts`, or `use-theme.ts`.

---

### `types/polymorphic.ts` — `PolymorphicRenderProps` (soribashi addition)

- **File:** `packages/factory/src/types/polymorphic.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts` (commit 63dafbbf)
- **Mantine behavior:** No `PolymorphicRenderProps` type. Mantine components call `useProps`, `useStyles` directly inside their render function. No `render` callback pattern.
- **Soribashi behavior:** `PolymorphicRenderProps<TOwnProps>` with `Element: ElementType; props: TOwnProps` is the object passed to the `render` callback of `definePolymorphicComponent`. It is a soribashi-only type for the constructor pattern.
- **Reason for divergence:** Soribashi addition. Required by the constructor model (already in ledger under "definePolymorphicComponent — higher-level constructor vs Mantine's type-cast utilities").
- **Disposition:** Keep — soribashi addition
- **Test:** `packages/factory/test/polymorphic-parity.test.tsx` — P13/P14 group (render callback receives Element and props)

---

### `types/polymorphic.ts` — `ComponentPropsWithRef` vs `ComponentProps` for ref inclusion (PL3)

- **File:** `packages/factory/src/types/polymorphic.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/create-polymorphic-component.ts` (commit 63dafbbf)
- **Mantine behavior:** `PropsOf<C>` uses `React.ComponentProps<C>` (no explicit ref in props object; ref handled separately by `ref?: PolymorphicRef<C>` added inline).
- **Soribashi behavior:** Uses `ComponentPropsWithRef<TAs>` — ref is included in the inherited props surface automatically, then `RefAttributes<PolymorphicRef<TAs>>` is intersected via `PolymorphicComponentProps`.
- **Reason for divergence:** Soribashi's approach is more explicit about ref inclusion; both produce equivalent type shapes for callers.
- **Disposition:** Keep — INTENTIONAL, superior explicitness
- **Test:** Type-only; confirmed by polymorphic parity tests passing typecheck.

---

### `types/factory-payload.ts` — `ctx?` field omitted from FactoryPayload

- **File:** `packages/factory/src/types/factory-payload.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload line 7, commit 63dafbbf)
- **Mantine behavior:** `FactoryPayload.ctx?: any` — threaded through `StylesApiRecord` callback signature as `(theme, props, ctx)` to give compound components access to parent context.
- **Soribashi behavior:** No `ctx` field in `FactoryPayload`. Callbacks receive `(theme, props)` only.
- **Reason for divergence:** Consistent with the pre-existing decision to omit `stylesCtx` from `useStyles` (documented in ledger under "useStyles — simpler resolution model"). The `ctx` parameter is only useful when a component's styles depend on parent compound context. Soribashi's compound components use props directly.
- **Disposition:** Keep — INTENTIONAL, consistent with existing architecture
- **Test:** Type-only. Confirmed by all factory test files passing typecheck.

---

### `types/factory-payload.ts` — `signature?` field omitted from FactoryPayload

- **File:** `packages/factory/src/types/factory-payload.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload line 19, commit 63dafbbf)
- **Mantine behavior:** `FactoryPayload.signature?: any` — stores the generic component's call signature for `genericFactory`. The caller writes `signature: <Value extends Primitive>(props: SelectProps<Value>) => JSX.Element` in the payload and `genericFactory` re-casts to it.
- **Soribashi behavior:** No `signature` field. `defineGenericComponent` uses `GenericComponentFn` pattern — the component is always typed as `<T>(props: ...) => ...` without needing a payload slot.
- **Reason for divergence:** Soribashi's constructor approach encapsulates the generic type differently; the `signature` escape hatch is not needed. Already in ledger under "defineGenericComponent — GenericComponentFn type vs Mantine's Payload['signature']".
- **Disposition:** Keep — INTENTIONAL, consistent with constructor model
- **Test:** `packages/factory/test/generic-parity.test.tsx` — "G8: GenericComponentFn type — runtime shape"

---

### `types/factory-payload.ts` — `vars?: Record<string, string>` vs Mantine's `vars?: any`

- **File:** `packages/factory/src/types/factory-payload.ts`
- **Mantine source:** `packages/@mantine/core/src/core/factory/factory.tsx` (FactoryPayload line 11, commit 63dafbbf)
- **Mantine behavior:** `vars?: any` — completely untyped; the specific shape is enforced by `VarsResolver`/`PartialVarsResolver` types at call sites.
- **Soribashi behavior:** `vars?: Record<string, string>` — typed as a simple string record. This constrains what consumers can declare in their payload.
- **Reason for divergence:** Soribashi's stricter type is appropriate because CSS variable values are always strings. No behavioral impact; type-only improvement.
- **Disposition:** Keep — INTENTIONAL, superior type safety
- **Test:** Type-only.

---

### `types/props.ts` — `StylesApiProps` includes `className`, `style`, `children`

- **File:** `packages/factory/src/types/props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` (StylesApiProps, lines 52-59, commit 63dafbbf)
- **Mantine behavior:** `StylesApiProps` has: `unstyled?`, `variant?`, `classNames?`, `styles?`, `vars?`, `attributes?`. Common DOM props (`className`, `style`, `children`) are added separately in each component's own props interface.
- **Soribashi behavior:** `StylesApiProps` additionally includes `className?`, `style?`, `children?`. These are bundled in for ergonomics — components don't have to re-declare them.
- **Reason for divergence:** Soribashi addition for ergonomics. All components accept these props; bundling reduces boilerplate.
- **Disposition:** Keep — INTENTIONAL, soribashi ergonomic addition
- **Test:** Covered by all `getStyles` call sites in the test suite; confirmed by typecheck.

---

### `types/props.ts` — `variant` omitted from `StylesApiProps`

- **File:** `packages/factory/src/types/props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` (line 54, commit 63dafbbf)
- **Mantine behavior:** `StylesApiProps` includes `variant?: Payload['variant'] extends string ? Payload['variant'] | (string & {}) : string` — the variant prop with an open-ended union allowing custom string variants alongside typed ones.
- **Soribashi behavior:** `variant` is NOT in `StylesApiProps`. Components that accept `variant` declare it in their own props type.
- **Reason for divergence:** Soribashi architectural choice — `variant` is component-specific, not a universal Styles API prop. Components declare it in their payload `variant` field and expose it in their own props interface. `useStyles` reads `props.variant` for CSS class generation. Equivalent result; different structural placement.
- **Disposition:** Keep — INTENTIONAL
- **Test:** `packages/factory/test/use-styles-parity.test.tsx` — variant-related branches pass with props.variant.

---

### `types/props.ts` — compound-component gating absent from `Attributes<P>` and `ClassNames<P>`/`Styles<P>`

- **File:** `packages/factory/src/types/props.ts`
- **Mantine source:** `packages/@mantine/core/src/core/styles-api/styles-api.types.ts` (StylesApiRecord lines 18-33, Attributes lines 42-46, commit 63dafbbf)
- **Mantine behavior:** When `Payload['compound'] extends true`, `StylesApiRecord` restricts to a plain record (no function form). `Attributes` becomes `never` for compound components.
- **Soribashi behavior:** No compound branching — `ClassNames<P>`, `Styles<P>`, and `Attributes<P>` have the same shape regardless of `compound`.
- **Reason for divergence:** Consistent with the simpler `useStyles` architecture. Soribashi's compound components are handled by convention (using the `compound: true` flag in the payload), not by type-level restriction.
- **Disposition:** Keep — INTENTIONAL, consistent with simpler architecture
- **Test:** Type-only.

---

### `types/render-context.ts` — full soribashi addition (no Mantine analog)

- **File:** `packages/factory/src/types/render-context.ts`
- **Mantine source:** No direct analog (commit 63dafbbf)
- **Mantine behavior:** Components call `const { className, style, ...others } = getStyles('root')` but this is not typed via a shared result type — Mantine's `getStyles` return type is inferred at each call site.
- **Soribashi behavior:** `GetStylesResult`, `GetStylesFn<P>`, `GetStylesOptions`, and `RenderContext<P>` are explicit shared types passed to every component render callback.
- **Reason for divergence:** Soribashi's constructor model requires explicit typing for the render callback parameter. These types are the soribashi-only "plumbing" for the constructor pattern.
- **Disposition:** Keep — soribashi addition, required by constructor model
- **Test:** Type-only; confirmed by all `defineComponent`/`definePolymorphicComponent`/`defineGenericComponent` tests passing.

---

## Coverage manifest rows (Batch T2-B)

```
| packages/factory/src/provider/provider.tsx | core/MantineProvider/MantineProvider.tsx | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | SoribashiProvider-minimal (pre-existing) |
| packages/factory/src/provider/context.ts | core/MantineProvider/Mantine.context.ts | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | useTheme-default-fallback (pre-existing), SoribashiProvider-minimal (pre-existing) |
| packages/factory/src/provider/use-theme.ts | core/MantineProvider/Mantine.context.ts (useMantineContext) | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | useTheme-default-fallback (pre-existing) |
| packages/factory/src/types/polymorphic.ts | core/factory/create-polymorphic-component.ts | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | PolymorphicComponentProps-own-props-win (pre-existing), PolymorphicRenderProps-addition (new), ComponentPropsWithRef-vs-ComponentProps (new) |
| packages/factory/src/types/factory-payload.ts | core/factory/factory.tsx (FactoryPayload) | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | FactoryPayload-ctx-omitted (new), FactoryPayload-signature-omitted (new), FactoryPayload-vars-typed (new) |
| packages/factory/src/types/props.ts | core/styles-api/styles-api.types.ts | 2 | intentional divergence | 2026-04-25-tier-2-provider-types.md | StylesApiProps-className-style-children (new), StylesApiProps-variant-omitted (new), StylesApiProps-compound-gating-absent (new) |
| packages/factory/src/types/render-context.ts | (no direct analog) | 2 | soribashi addition | 2026-04-25-tier-2-provider-types.md | RenderContext-soribashi-addition (new) |
```
