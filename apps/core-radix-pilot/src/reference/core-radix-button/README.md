# core-radix Button — vendored snapshot

**Source:** `/Users/matt/Documents/GitHub/assured/assured-primary/apps/adjuster/src/components/ClaimViewIslands/core-radix/Buttons/`
**Snapshot date:** 2026-04-26
**Purpose:** read-only reference for Wave 1 side-by-side visual review.

## Rules

- This directory is read-only reference material. Do NOT edit any file inside it.
- The recipe code at `apps/core-radix-pilot/src/recipes/Button/` MUST NOT import from this directory at any point.
- The pilot's demo page (`pages/ButtonMatrix.tsx`) imports from here ONLY to render side-by-side reference output.
- The vendored copy is never shipped beyond this pilot app.
- If the upstream CVI Button changes meaningfully and you want to refresh the snapshot, run the same `cp -R` command and update the snapshot date above.

## Why vendor instead of installing?

CVI is in a separate monorepo (assured-dev). Wave 1's spec scope explicitly forbids touching assured-dev. Vendoring is the simplest way to render CVI's current Button alongside the recipe in one running app for visual diff.
