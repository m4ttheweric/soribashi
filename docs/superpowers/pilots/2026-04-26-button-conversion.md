# Button Conversion Pilot — Journal

**Wave:** 1
**Date started:** 2026-04-26
**Spec:** `docs/superpowers/specs/2026-04-26-token-consolidation-and-button-pilot-design.md`

## 1. Legacy Button surface inventory (Task 1.2)

### 1.1 Variants (visual style)

CVI's variant set: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`.

**Inconsistency:** The variant prop in CVI's Button mixes visual style (`outline`, `ghost`) with semantic role (`primary`, `secondary`, `danger`, `success`) — three are visual, three are intent-shaped. This conflates two orthogonal axes.

**Wave 1 consolidation:** Split into:
- `variant` (visual): `filled`, `outline`, `subtle`, `ghost`, `link`
- `intent` (semantic role): `primary`, `neutral`, `success`, `warning`, `danger`, `info`

Rationale: matches the existing soribashi convention (see `apps/playground/src/components/Button/Button.tsx` and the playground theme). Lets one component express ALL the (variant × intent) cells without an explosion of one-off variants.

**Migration map for CVI's existing usages** (informational — actual migration is the integration project's work):
- `<Button variant="primary">` → `<Button intent="primary" variant="filled">`
- `<Button variant="secondary">` → `<Button intent="neutral" variant="filled">` (or `subtle` — see § 4)
- `<Button variant="outline">` → `<Button intent="neutral" variant="outline">`
- `<Button variant="ghost">` → `<Button intent="neutral" variant="ghost">`
- `<Button variant="danger">` → `<Button intent="danger" variant="filled">`
- `<Button variant="success">` → `<Button intent="success" variant="filled">`

### 1.2 Sizes

CVI: `sm`, `md`, `lg`. Wave 1: same.

### 1.3 States

| CVI prop | CVI behavior | Wave 1 prop |
|---|---|---|
| `isLoading` | Shows spinner, suppresses click | `loading` (renamed) |
| `disabled` | HTMLButton disabled | `disabled` (passthrough) |
| `fullWidth` | `w-full` class | `fullWidth` (kept) |
| `leftIcon` | IconKey or ReactElement; rendered before children | `leftIcon` (kept; ReactNode only — IconKey wrapping is the integration project's concern) |
| `rightIcon` | (same) | `rightIcon` (kept) |
| `asChild` | Renders children as a slot via Radix Slot | Polymorphic `as` prop instead — see § 1.4 |

### 1.4 Polymorphism

CVI uses Radix Slot (`asChild` prop). Wave 1 uses soribashi's `definePolymorphicComponent` with an `as` prop. Why the change: `as` is more typesafe, the soribashi convention, and removes the `Slot` runtime dependency from the recipe. Migration map:
- `<Button asChild><a href="/x">Link</a></Button>` → `<Button as="a" href="/x">Link</Button>`

This is a meaningful API divergence — flag in the journal as a finding for design review.

**CVI footgun:** `asChild` is silently ignored when combined with `isLoading`, `leftIcon`, or `rightIcon`. The implementation guard at `apps/core-radix-pilot/src/reference/core-radix-button/Button.tsx:144` reads `if (asChild && !isLoading && !leftIcon && !rightIcon)` — when any of those props is set, execution falls through to the regular `<button>` branch with no warning, no dev-mode log, no type error. The `as` prop replacement in Wave 1 avoids this class of bug because polymorphism is independent of icon/loading rendering — `<Button as="a" loading leftIcon={...}>` correctly renders an `<a>` with both leftIcon and a spinner.

## 2. Consolidated Button shape (Task 1.3)

_Populated as recipe is authored._

## 3. What was easy / what was hard (Task 1.7)

_Populated as Phase 1 progresses._

## 4. Soribashi gaps surfaced

- **Pilot vitest config did not include a jest-dom setup file.** _Severity: minor — pilot-harness wiring, not a soribashi-package gap, but surfaced during Task 1.5 GREEN._ Task 1.3's `apps/core-radix-pilot/vitest.config.ts` snippet did not include `setupFiles`, and Task 1.4's behavior tests use `expect(...).toBeDisabled()` which requires `@testing-library/jest-dom`. Without the setup, 10/11 tests passed and the disabled-on-loading test failed with `Invalid Chai property: toBeDisabled`. **Resolution applied in Task 1.5:** added `apps/core-radix-pilot/test/setup.ts` (one line: `import '@testing-library/jest-dom/vitest';`) and wired it via `setupFiles: ['./test/setup.ts']` in the pilot vitest config. Mirrors the convention already in use at `packages/factory/test/setup.ts` and `packages/blocks/test/setup.ts`. **Recommendation for the playbook:** the pilot-app vitest config template should include the jest-dom setup wiring by default.
- **`definePolymorphicComponent` `render` does not strip styles-API props before passing to `Element`.** _Severity: minor — recipe-author footgun, not a blocker._ The `props` passed to `render({ Element, props, getStyles })` still contains `classNames`, `styles`, `vars`, `attributes`, `unstyled`, `className`, `style` from the StylesApiProps surface. If the recipe author spreads `...rest` onto a DOM element without first destructuring those off, React will warn (and pass non-DOM attrs through). The Button recipe explicitly strips all seven keys; the existing `definePolymorphicComponent` test (`packages/factory/test/define-polymorphic-component.test.tsx:18`) does the same with a wide `...rest` cast to `any`. **Recommendation for the playbook:** either (a) `useProps`/`useStyles` should consume those keys and the `render` ctx should expose a pre-cleaned `props`; or (b) the documentation should call out the destructure pattern explicitly with a copy-pasteable snippet. Not blocking for Wave 1 — the pattern works once you know it.

## 5. IconButton + ButtonDropdown extension sketch (Task 1.10)

_Populated below._

## 6. Recommended playbook entries — pure-styled-primitive category (Task 1.10)

_Populated below._
