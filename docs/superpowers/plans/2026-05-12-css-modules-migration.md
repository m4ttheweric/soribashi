# CSS Modules Migration Implementation Plan

> Already implemented in commits on this branch — this plan describes the work in narrative form for retrospective clarity.

**Goal:** Migrate Button / Tooltip / Tabs from `.css` to `.module.css`; add `vite-env.d.ts` for typed module imports; update the conversion playbook.

**Spec:** `docs/superpowers/specs/2026-05-12-css-modules-migration-design.md`

## Commits on this branch (chronological)

1. `chore(pilot): add vite-env.d.ts for typed CSS module imports`
2. `refactor(tooltip): migrate to Tooltip.module.css`
3. `refactor(tabs): migrate to Tabs.module.css`
4. `refactor(button): add xs and xl size cells`
5. `refactor(button): migrate to Button.module.css`
6. `docs(playbook): codify CSS-modules convention in §§ 2.1 / 2.2 / 2.3 / 2.4`
7. `docs(specs): css modules migration design` *(this spec)*
8. `docs(plans): css modules migration plan` *(this file)*

## Per-recipe steps

For each of Tooltip, Tabs, Button:
1. Rename `Recipe.css` → `Recipe.module.css`.
2. Inside the renamed file, strip the `cr-Recipe-` class-selector prefix (selectors become `.root`, `.trigger`, etc.). Keyframes and CSS custom properties stay verbatim — they aren't class names.
3. For Button only: rewrite the dark-mode rule `.dark .cr-Button-root::before` as `:global(.dark) .root::before` — parent class is global, child class is local.
4. In `Recipe.tsx`: swap `import './Recipe.css'` for `import classes from './Recipe.module.css'`. Replace the string-literal `classes:` map with bare `classes,`.
5. In `Recipe.test.tsx` (Tooltip + Tabs only — Button tests assert on `data-*` attributes): add `import classes from './Recipe.module.css'`. Rewrite assertions from `'cr-Recipe-X'` literals to `classes.X`. Consumer-supplied class names (`custom-content-class`, etc.) stay as literals.
6. Run pilot tests; expect 47 passed each time.

## Verification

After all commits:
- `bun run typecheck` clean
- 461 + 244 + 47 unchanged
- Manual visual sanity in `bun run dev`
