# Soribashi

Bun-workspace monorepo: a component-authoring framework for React adapted from Mantine (MIT).

## Commands

```bash
bun run test            # vitest across all packages
bun run typecheck       # tsc -p tsconfig.json --noEmit
bun run lint            # biome check .
bun run codegen         # theme -> CSS/Tailwind config
bun run dev:workshop    # apps/workshop dev server (recipe showcase + multi-tenant demo)
bun run test:visual     # visual-regression tier (Chromium, compares against committed baselines)
bun run generate:ui     # regenerate packages/ui/manifest.json and registry/*.json from the recipes
bun run smoke:registry  # end-to-end shadcn-CLI install smoke check against the generated registry
```

**Trap:** always `bun run test`. Plain `bun test` invokes Bun's own test runner, not vitest.

## Orientation

- **Start at `STATUS.md`. It is the single orientation entry point:** the latest slice's record sits on top (older slice records below, unchanged), and its own Orientation block points at every other context document this repo uses (the authoring skill, the playbook, and the gitignored `.local-dev/` specs, plans, and per-slice outcomes records). Nothing in this file duplicates what STATUS.md indexes.

## Invariants

1. `Recipe.extend()` is first-class public API and must not be bypassed. Never work around it (e.g. via the Record component form) or break `.extend({ defaultProps: { size } })` threading.
2. Vocabulary (`size` / `intent` / `variant` values) is theme-declared via `defineVocabulary`. Soribashi itself has no opinion on the values; never hardcode a vocabulary into the framework.
