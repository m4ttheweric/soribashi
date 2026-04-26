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
| packages/factory/src/use-random-class-name.ts | core/Box/use-random-classname/use-random-classname.ts | 1 | intentional divergence | 2026-04-25-tier-1-hash-and-classname.md | useRandomClassName-stripIdMarkers-extraction (new, kept), useRandomClassName-prefix-sb (TOKEN_DIFF, kept), useRandomClassName-no-hook-replacement (INTENTIONAL — not in @mantine/hooks) |
| packages/factory/src/hash-style-props.ts | core/InlineStyles/hash-styles.ts | 1 | intentional divergence | 2026-04-25-tier-1-hash-and-classname.md (Task 1.6 re-walk) + 2026-04-25-tier-1-inline-styles.md (HS-01 through HS-07) | hashStyleProps-file-location (HS-01, kept), hashStyleProps-prefix (HS-06/H7, TOKEN_DIFF kept), hashStyleProps-serialization (HS-07/H5-H6, kept), hashStyleProps-types (HS-03/HS-04/H3/H4, kept), hashStyleProps-algorithm-identical (H2, IDENTICAL) |
