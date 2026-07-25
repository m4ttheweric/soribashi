# Soribashi

Bun-workspace monorepo: a component-authoring framework for React adapted from Mantine (MIT).

## Commands

```bash
bun run test            # vitest across all packages
bun run typecheck       # tsc -p tsconfig.json --noEmit
bun run lint            # biome check .
bun run codegen         # theme -> CSS/Tailwind config
bun run test:browser    # Playwright parity suite
bun run dev:workshop    # apps/workshop dev server (recipe showcase + multi-tenant demo)
bun run test:visual     # visual-regression tier (Chromium, compares against committed baselines)
bun run generate:ui     # regenerate packages/ui/manifest.json and registry/*.json from the recipes
bun run smoke:registry  # end-to-end shadcn-CLI install smoke check against the generated registry
```

**Trap:** always `bun run test`. Plain `bun test` invokes Bun's own test runner, not vitest.

## Orientation

- `STATUS.md` is the implementation status record (slice 1b top section, post-v1 record, v1 foundation record).
- The recipe conversion playbook lives at `docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md`; it defines the four authoring categories and the conversion sweep.
- `.claude/skills/authoring-a-recipe/SKILL.md` is the agent-facing authoring path for a `packages/ui` recipe: four-file layout, builder selection, CSS rules, test-tier expectations, and the traps.

## Invariants

1. `Recipe.extend()` is first-class public API and must not be bypassed. Never work around it (e.g. via the Record component form) or break `.extend({ defaultProps: { size } })` threading.
2. Vocabulary (`size` / `intent` / `variant` values) is theme-declared via `defineVocabulary`. Soribashi itself has no opinion on the values; never hardcode a vocabulary into the framework.
