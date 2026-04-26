# Mantine Coverage Manifest — 2026-04-25 Full Audit

**Pinned to:** `mantinedev/mantine@63dafbbf5f0135eb36455b7add4c0ddcd0f3240a`

**Plan:** [`docs/superpowers/plans/2026-04-25-plan-mantine-full-audit.md`](../plans/2026-04-25-plan-mantine-full-audit.md)

**Spec:** [`docs/superpowers/specs/2026-04-25-mantine-full-audit-design.md`](../specs/2026-04-25-mantine-full-audit-design.md)

**Status legend:**
- `matches` — soribashi behavior matches Mantine (post token-substitution); no findings.
- `drift fixed` — drift was found and corrected; see ledger entries.
- `intentional divergence` — soribashi diverges deliberately; see ledger entries.
- `soribashi addition` — no Mantine analog; soribashi-only feature.
- `hook replaced` — soribashi reimplementation removed; now imports from `@mantine/hooks`.

| Soribashi file | Mantine analog | Tier | Status | Audit doc | Ledger entries |
|---|---|---|---|---|---|
| packages/factory/src/factory.tsx | core/factory/factory.tsx | 1 | drift fixed | 2026-04-25-tier-1-factory.md | factory-forwardRef (pre-existing, kept), factory-withProps-undefined-filter (pre-existing, kept), makeWithProps-extend-propagation (fixed) |
| packages/factory/src/polymorphic-component.tsx | core/factory/polymorphic-factory.tsx | 1 | drift fixed | 2026-04-25-tier-1-polymorphic.md | polymorphicFactory-forwardRef (pre-existing, kept), polymorphicFactory-as-prop (pre-existing, kept), makeWithProps-extend-propagation (fixed — shared fix with factory.tsx) |
| packages/factory/src/define-polymorphic-component.tsx | core/factory/polymorphic-factory.tsx + create-polymorphic-component.ts | 1 | intentional divergence | 2026-04-25-tier-1-polymorphic.md | definePolymorphicComponent-higher-level-constructor (new), definePolymorphicComponent-classes-static (new), definePolymorphicComponent-defaultElement (new) |
| packages/factory/src/define-generic-component.tsx | core/factory/factory.tsx (genericFactory) | 1 | drift fixed | 2026-04-25-tier-1-generic.md | makeWithProps-extend-propagation (covered by factory + polymorphic ledger entry), defineGenericComponent-constructor-model (intentional), GenericComponentFn-type (intentional), defineGenericComponent-classes-static (intentional), makeWithProps-stacking (intentional) |
