# Soribashi

Bun-workspace monorepo: a component-authoring framework for React adapted from Mantine (MIT).

## Commands

```bash
bun run test           # vitest across all packages
bun run typecheck      # tsc -p tsconfig.json --noEmit
bun run lint           # biome check .
bun run codegen        # theme -> playground generated CSS/Tailwind config
bun run codegen:tenants
bun run codegen:pilot  # theme -> apps/pilot generated outputs
bun run test:browser   # Playwright parity suite
bun run dev:pilot      # flagship consumer app
```

**Trap:** always `bun run test`. Plain `bun test` invokes Bun's own test runner, not vitest.

## Orientation

- `STATUS.md` is the implementation status record (post-v1 top section + v1 foundation record).
- The recipe conversion playbook lives at `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`; it defines the four authoring categories and the conversion sweep.

## Invariants

1. `Recipe.extend()` is first-class public API and must not be bypassed. Never work around it (e.g. via the Record component form) or break `.extend({ defaultProps: { size } })` threading.
2. Vocabulary (`size` / `intent` / `variant` values) is theme-declared via `defineVocabulary`. Soribashi itself has no opinion on the values; never hardcode a vocabulary into the framework.
