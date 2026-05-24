# CSS Modules Migration — Recipes Move from Plain `.css` to `.module.css`

> **Status:** Design (2026-05-12). **Sizing:** S. **Supersedes:** the CSS-modules side of the prior `library-authoring-hygiene-design.md` work (the prior spec was removed when the branch was reset; the vocabulary side of that prior spec was wrong and was redesigned in `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md`, preserved on branch `worktree-vocabulary-rails-core`).

## Problem

The three shipped recipes (Button, Tooltip, Tabs) use plain `.css` files with `cr-Recipe-slot` global-prefixed class names. The `cr-` prefix is convention-only — not build-time scoped. Two soribashi-derived libraries shipping `.cr-Button-root` would collide. Tests assert on string literals (`expect(el.className).toContain('cr-Tabs-trigger')`) which break if the class is renamed.

## Goals

- Class-name collisions are impossible at build time, not "unlikely by convention."
- Test assertions are refactor-safe (renaming `.root` in CSS doesn't break tests).
- Consumers can override slot styles via their own CSS modules (already-supported `classNames` prop).
- The conversion playbook codifies the pattern so future recipes (Wave 4+) inherit it.

## Non-goals

- **Shared vocabulary types.** Removed from this PR's scope. Vocabulary work is designed in `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md` (branch `worktree-vocabulary-rails-core`) and ships in a separate PR.
- **Wave 4 (Select).** This work lands before Wave 4 so Select inherits the CSS-modules convention.

## Design

Each recipe owns a `RecipeName.module.css` file. Class names inside the module are plain (`.root`, `.trigger`, `.content`). The CSS module compiler scopes them at build time.

The recipe imports the module as a default export:

```ts
import classes from './Button.module.css';

export const Button = definePolymorphicComponent({
  name: 'Button',
  // ...
  classes,  // slots in directly
  // ...
});
```

The default export shape is `Readonly<Record<string, string>>` mapping each declared class name to its build-time-scoped form. This matches the factory's `classes?: Partial<Record<TSelectors[number], string>>` config field structurally — no factory change.

**Vite + Vitest pipeline.** Native support, no config changes. Add `apps/core-radix-pilot/src/vite-env.d.ts` with `/// <reference types="vite/client" />` for typed `import classes from './X.module.css'`.

**Data-attribute selectors.** `.root[data-variant='filled']` inside the module becomes `.{scoped-root}[data-variant='filled']` — CSS modules transform class names only, not attribute selectors. The existing intent×variant matrix on Button works unchanged.

**Dark-mode rule.** Use `:global(.dark)` to opt the parent class out of scoping: `:global(.dark) .root::before { ... }`.

**Test pattern.** Tests import the same CSS module and assert against `classes.slot` instead of string literals.

## Button size CSS cells (xs and xl)

Adds `[data-size='xs']` and `[data-size='xl']` cells to Button's CSS, extending the existing 2rem/2.5rem/3rem progression by ~0.5rem in each direction. The `Size` type in `Button.tsx` is intentionally NOT widened here — the type-level vocabulary work belongs to the vocabulary-rails PR. The cells are dormant until a consumer passes `size="xs"` or `size="xl"`, which no current code does.

## Migration

One commit per recipe. Order: Tooltip → Tabs → Button (smallest first, sanity-check the pipeline early).

## Verification

- `bun run typecheck` clean
- `bun run --filter '@soribashi/*' test` — 461 + 244 unchanged
- `cd apps/core-radix-pilot && bunx vitest run` — 47 unchanged
- Manual visual sanity in dev playground

## References

- Vocabulary follow-up: `docs/superpowers/specs/2026-05-12-vocabulary-rails-design.md` (branch `worktree-vocabulary-rails-core`)
- Mantine `Button.module.css` reference: `/Users/matt/Documents/GitHub/mantine/packages/@mantine/core/src/components/Button/Button.module.css`
