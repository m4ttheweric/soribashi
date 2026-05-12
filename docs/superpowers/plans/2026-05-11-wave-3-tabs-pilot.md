# Wave 3 — Tabs Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Wave 3 Tabs pilot — a 4-part `defineCompound` recipe wrapping `@radix-ui/react-tabs` with three variants (`default | outline | pills`), horizontal orientation only, and a polymorphic `Tabs.Trigger` exercising `PolymorphicPartConfig`.

**Architecture:** Recipe lives in `apps/core-radix-pilot/src/recipes/Tabs/`. Inherits `defineCompound` + `PolymorphicPartConfig` from Wave 2 (already shipped in `packages/factory/`). No factory changes anticipated. Substrate is Radix Tabs — recipe is mostly styling, slot wiring, and the polymorphic Trigger seam. Variant styling uses Wave 1's data-attribute + `vars`-resolver hybrid.

**Tech Stack:** React 18, `@soribashi/core` (workspace), `@radix-ui/react-tabs` (new dep), vitest + @testing-library/react for tests, Vite for the pilot app dev server.

**Spec:** `docs/superpowers/specs/2026-05-10-wave-3-tabs-pilot-design.md` (commit `47275e1`)

**Sizing:** M

---

## Pre-flight

Before starting, the engineer should be in the `main` branch of `/Users/matt/Documents/GitHub/soribashi/` with a clean working tree. The plan creates a feature branch (`wave-3-tabs-pilot`) and lands the work via PR — same shape as Wave 2's PR #7.

Process lessons from Wave 2 (apply to Wave 3 reviews):

1. **Run BOTH Copilot and CodeRabbit early.** They find different things — Copilot caught architecture-level type holes; CodeRabbit caught CSS deprecations, doc drift, R19 forward-compat, lint conventions. Don't run one and hope the other isn't needed.
2. **Stop reviewing after 2-3 rounds with the same reviewer.** Knock-on rate climbs to 25-66% by round 3-4; the marginal real-bug-caught rate drops below the diff-noise cost. Bundle several rounds' fixes into one careful pass.
3. **When fixing a flagged issue, look for the broader class.** Don't iterate one cell of a matrix at a time — map out the full surface and address it in one pass.

The highest-risk surface in Wave 3 is `Tabs.Trigger`'s polymorphic config — `PolymorphicPartConfig` is typed and tested in `packages/factory/` but no recipe has exercised it. Bugs in the polymorphic seam (ref forwarding, `<Element>` resolution, Radix Slot interaction) are the most likely to surface during review. The polymorphic-Trigger ref-forwarding test (Task 6) is the canary; if that test goes green, the seam works.

---

## Task 1: Branch + dependency + baseline-green check

**Files:**
- Modify: `apps/core-radix-pilot/package.json` (add `@radix-ui/react-tabs`)

- [ ] **Step 1: Create the feature branch**

```bash
git -C /Users/matt/Documents/GitHub/soribashi checkout -b wave-3-tabs-pilot
```

Expected: `Switched to a new branch 'wave-3-tabs-pilot'`

- [ ] **Step 2: Verify baseline-green starting state**

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run typecheck
```

Expected: clean exit, no errors.

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run --filter '@soribashi/*' test
```

Expected: 460 factory + 244 blocks tests pass.

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run --reporter=basic
```

Expected: 24/24 pilot tests pass.

If any of these are red, stop and fix before continuing — the spec's "Sanity check the inheritance" requirement.

- [ ] **Step 3: Install `@radix-ui/react-tabs`**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bun add @radix-ui/react-tabs
```

Expected: package added to `dependencies`. Verify version is `^1.x` (current major). The exact patch version is whatever bun resolves.

- [ ] **Step 4: Verify the install didn't break anything**

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run typecheck
```

Expected: clean exit.

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run --reporter=basic
```

Expected: still 24/24 pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/matt/Documents/GitHub/soribashi && git add apps/core-radix-pilot/package.json bun.lock && git commit -m "chore(wave-3): add @radix-ui/react-tabs dep for Tabs pilot"
```

Note: if `bun.lock` is `bun.lockb`, use that path instead. Check `ls apps/core-radix-pilot/../../*.lock*` if uncertain.

---

## Task 2: Recipe scaffold — Root + List + minimal smoke test

**Files:**
- Create: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx`
- Create: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.css`
- Create: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx`

This task lands the minimum compileable recipe: Root + List parts only, no Trigger/Content yet. The point is to validate the `defineCompound` config shape compiles and the safe-context works before adding more parts.

- [ ] **Step 1: Write the smoke test (failing)**

Create `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx`:

```tsx
/**
 * Tabs recipe tests — Wave 3 pilot
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SoribashiProvider } from '@soribashi/core';
import { theme } from '../../theme/index.ts';
import { Tabs } from './Tabs.tsx';

function withProviders(node: React.ReactNode) {
  return <SoribashiProvider theme={theme}>{node}</SoribashiProvider>;
}

describe('Tabs recipe', () => {
  it('renders Tabs.Root + Tabs.List with children', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List data-testid="list">
            <span>list-child</span>
          </Tabs.List>
        </Tabs>,
      ),
    );

    expect(screen.getByTestId('list')).toBeInTheDocument();
    expect(screen.getByText('list-child')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: FAIL — `Cannot find module './Tabs.tsx'` or equivalent module-not-found error.

- [ ] **Step 3: Create minimal CSS**

Create `apps/core-radix-pilot/src/recipes/Tabs/Tabs.css`:

```css
/* base — applies to all variants */
.cr-Tabs-list {
  display: flex;
  gap: 0.25rem;
}
```

- [ ] **Step 4: Create the minimal recipe (Root + List only)**

Create `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx`:

```tsx
/**
 * Tabs recipe — Wave 3 pilot for the persistent-navigational-compound category.
 *
 * Authored with `defineCompound` from @soribashi/core. Wraps
 * @radix-ui/react-tabs and exercises:
 *   - defineCompound with four parts: Root, List, Trigger, Content
 *   - Polymorphic Trigger via PolymorphicPartConfig (defaultElement: 'button')
 *   - Three variants: default | outline | pills
 *   - Controlled active-value via Radix Tabs (no soribashi-side state)
 *   - data-attribute + vars-resolver hybrid for variant styling
 *
 * Spec: docs/superpowers/specs/2026-05-10-wave-3-tabs-pilot-design.md
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { defineCompound, type PartRenderCtx } from '@soribashi/core';
import './Tabs.css';

type Variant = 'default' | 'outline' | 'pills';

export interface TabsRootProps {
  variant?: Variant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

export interface TabsListProps {
  children?: ReactNode;
}

interface TabsCtxExtras {
  // No extras beyond what the factory injects (variant, getStyles).
}

export const Tabs = defineCompound({
  name: 'Tabs',
  variants: ['default', 'outline', 'pills'] as const,
  classes: {
    root: 'cr-Tabs-root',
    list: 'cr-Tabs-list',
    trigger: 'cr-Tabs-trigger',
    content: 'cr-Tabs-content',
  },
  defaults: { variant: 'default' } as Partial<TabsRootProps>,
  vars: (_theme, _props) => ({}),
  context: (_rootProps) => ({} as TabsCtxExtras),
  parts: {
    root: {
      render: ({ props, children }: PartRenderCtx<TabsRootProps, TabsCtxExtras>) => (
        <RadixTabs.Root
          value={props.value}
          defaultValue={props.defaultValue}
          onValueChange={props.onValueChange}
          data-variant={props.variant}
        >
          {children}
        </RadixTabs.Root>
      ),
    },
    list: {
      render: ({ getStyles, ctx, children }: PartRenderCtx<TabsListProps, TabsCtxExtras>) => (
        <RadixTabs.List data-variant={ctx.variant} {...getStyles()}>
          {children}
        </RadixTabs.List>
      ),
    },
  },
});
```

**Note on the slot/part asymmetry in this minimal scaffold.** `classes` declares all four slots (`root`, `list`, `trigger`, `content`) so we don't have to edit the slot map in Task 3 — only add the corresponding render functions in `parts`. Wave 2 spec § 3.1 documents that "factory does not require 1:1 mapping" between slots and parts; in this scaffold the `trigger` and `content` slot classes exist but no parts render them, so `Tabs.Trigger` and `Tabs.Content` are not yet attached to the `Tabs` namespace. The smoke test only references `Tabs` and `Tabs.List`, which is why it passes. Task 3 adds the missing parts.

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: PASS (1 test).

- [ ] **Step 6: Run typecheck**

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run typecheck
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/recipes/Tabs/ && git -C /Users/matt/Documents/GitHub/soribashi commit -m "feat(wave-3): scaffold Tabs recipe with Root + List parts"
```

---

## Task 3: Add Trigger (polymorphic) + Content parts

**Files:**
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx`
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx`

This task lands `Tabs.Trigger` as a polymorphic part (`defaultElement: 'button'`) and `Tabs.Content` as a standard part. Tests cover the render-lifecycle path: clicking a trigger switches the active panel.

- [ ] **Step 1: Write the failing tests**

Append to `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx` after the existing `describe` block's first `it`, but inside the same `describe`:

```tsx
  it('renders full Tabs with Trigger + Content; defaultValue panel is visible', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('data-state', 'inactive');
    expect(screen.getByText('content-a')).toBeInTheDocument();
    expect(screen.queryByText('content-b')).not.toBeInTheDocument();
  });

  it('clicking a Trigger switches data-state and the visible Content', async () => {
    const user = userEvent.setup();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-state', 'inactive');
    expect(screen.getByText('content-b')).toBeInTheDocument();
    expect(screen.queryByText('content-a')).not.toBeInTheDocument();
  });
```

Add `userEvent` import at the top of the test file:

```tsx
import userEvent from '@testing-library/user-event';
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: FAIL — `Tabs.Trigger is not a function` or similar (Trigger and Content are not yet defined as parts of the compound).

- [ ] **Step 3: Add Trigger and Content parts to the recipe**

Modify `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx`. First, add the type imports and new prop interfaces near the existing ones:

Replace the imports block:

```tsx
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import {
  defineCompound,
  type PartRenderCtx,
  type PolymorphicPartRenderCtx,
} from '@soribashi/core';
import './Tabs.css';
```

After the existing `TabsListProps` interface, add:

```tsx
export interface TabsTriggerOwnProps {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
}

export interface TabsContentProps {
  value: string;
  forceMount?: boolean;
  children?: ReactNode;
}
```

In the `parts:` block, after `list:`, add the two new parts:

```tsx
    // Trigger — class-2 AND polymorphic. defaultElement: 'button'.
    // Internally always uses RadixTabs.Trigger with asChild so Radix's
    // state-machine props (data-state, aria-selected, click handler,
    // keyboard handlers) merge onto whatever <Element> the consumer chose.
    // Public API: <Tabs.Trigger as="a" href="/foo" value="x">label</Tabs.Trigger>.
    // No public asChild — `as` is the canonical polymorphism mechanism here.
    trigger: {
      polymorphic: true,
      defaultElement: 'button',
      render: ({
        Element,
        ref,
        getStyles,
        ctx,
        props,
        children,
      }: PolymorphicPartRenderCtx<TabsTriggerOwnProps, 'button', TabsCtxExtras>) => (
        <RadixTabs.Trigger asChild value={props.value} disabled={props.disabled}>
          <Element ref={ref} data-variant={ctx.variant} {...getStyles()}>
            {children}
          </Element>
        </RadixTabs.Trigger>
      ),
    },
    content: {
      render: ({
        getStyles,
        props,
        children,
      }: PartRenderCtx<TabsContentProps, TabsCtxExtras>) => (
        <RadixTabs.Content
          value={props.value}
          forceMount={props.forceMount}
          {...getStyles()}
        >
          {children}
        </RadixTabs.Content>
      ),
    },
```

If TypeScript complains that `PolymorphicPartRenderCtx` doesn't accept the type-arg shape `<TabsTriggerOwnProps, 'button', TabsCtxExtras>`, check `packages/factory/src/define-compound.tsx` for the actual export signature — Wave 2's spec § 3.2 said it mirrors `definePolymorphicComponent`, and the OQ-9 resolution log mentioned `PolymorphicPartRenderCtx` in the public API. Adjust the type-arg order to match (likely `<TOwnProps, TDefaultAs, TCtxExtra, TVariants?, TSlotKeys?>` — the second slot is the element-type slot). Read the actual export before guessing.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: PASS (3 tests).

- [ ] **Step 5: Run typecheck**

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run typecheck
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/recipes/Tabs/ && git -C /Users/matt/Documents/GitHub/soribashi commit -m "feat(wave-3): add Tabs.Trigger (polymorphic) + Tabs.Content parts"
```

---

## Task 4: Controlled mode + keyboard navigation smoke tests

**Files:**
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx`

No recipe changes — Radix handles controlled state + keyboard. Just verify the wrapper doesn't break either.

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe('Tabs recipe', ...)` block:

```tsx
  it('controlled mode: value + onValueChange round-trip', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      withProviders(
        <Tabs value="a" onValueChange={onValueChange}>
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByText('content-a')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');

    // Consumer-controlled — has to push the new value back
    rerender(
      withProviders(
        <Tabs value="b" onValueChange={onValueChange}>
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByText('content-b')).toBeInTheDocument();
    expect(screen.queryByText('content-a')).not.toBeInTheDocument();
  });

  it('keyboard nav: arrow keys move focus and switch active tab', async () => {
    const user = userEvent.setup();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
            <Tabs.Trigger value="c">C</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
          <Tabs.Content value="c">content-c</Tabs.Content>
        </Tabs>,
      ),
    );

    const tabA = screen.getByRole('tab', { name: 'A' });
    tabA.focus();
    expect(tabA).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('data-state', 'active');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'C' })).toHaveFocus();

    // Loop back to first
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveFocus();
  });
```

Add `vi` to the vitest import at the top:

```tsx
import { describe, expect, it, vi } from 'vitest';
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: PASS (5 tests). Radix Tabs ships with arrow-key nav + auto-activation on focus (the `activationMode='automatic'` default).

- [ ] **Step 3: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx && git -C /Users/matt/Documents/GitHub/soribashi commit -m "test(wave-3): cover controlled mode + keyboard nav for Tabs"
```

---

## Task 5: Variant CSS + vars resolver

**Files:**
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx` (fill in `vars` resolver)
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.css` (add per-variant blocks)
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx` (variant assertions)

- [ ] **Step 1: Write the failing variant tests**

Append inside the `describe`:

```tsx
  it('default variant applies data-variant attribute on List, Root, and Triggers', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List data-testid="list">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByTestId('list')).toHaveAttribute('data-variant', 'default');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-variant', 'default');
  });

  it('variant="outline" propagates data-variant on List + Trigger', () => {
    render(
      withProviders(
        <Tabs variant="outline" defaultValue="a">
          <Tabs.List data-testid="list">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(screen.getByTestId('list')).toHaveAttribute('data-variant', 'outline');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-variant', 'outline');
  });

  it('variant="pills" sets the active-pill bg + color vars on the List slot', () => {
    render(
      withProviders(
        <Tabs variant="pills" defaultValue="a">
          <Tabs.List data-testid="list">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const list = screen.getByTestId('list') as HTMLElement;
    expect(list.style.getPropertyValue('--cr-tabs-active-bg')).toBe(
      'var(--color-primary-500)',
    );
    expect(list.style.getPropertyValue('--cr-tabs-active-color')).toBe(
      'var(--surface-default-foreground, var(--color-neutral-0))',
    );
  });

  it('non-pills variant: the active-pill vars resolve to transparent + text-default', () => {
    render(
      withProviders(
        <Tabs variant="default" defaultValue="a">
          <Tabs.List data-testid="list">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const list = screen.getByTestId('list') as HTMLElement;
    expect(list.style.getPropertyValue('--cr-tabs-active-bg')).toBe('transparent');
    expect(list.style.getPropertyValue('--cr-tabs-active-color')).toBe(
      'var(--text-default)',
    );
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: data-variant tests PASS (the recipe already emits the attribute); the var-tests FAIL because the `vars` resolver currently returns `{}`.

- [ ] **Step 3: Implement the vars resolver**

In `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx`, replace the empty `vars` block:

```tsx
  vars: (_theme, props) => ({}),
```

With:

```tsx
  vars: (_theme, props) => ({
    // Variant-driven token vars used by Tabs.css's [data-variant='pills']
    // block for the active-pill background/foreground. Other variants
    // don't read these but the resolver still emits sentinel values so
    // tests can assert the per-variant routing.
    list: {
      '--cr-tabs-active-bg':
        props.variant === 'pills' ? 'var(--color-primary-500)' : 'transparent',
      '--cr-tabs-active-color':
        props.variant === 'pills'
          ? 'var(--surface-default-foreground, var(--color-neutral-0))'
          : 'var(--text-default)',
    },
  }),
```

- [ ] **Step 4: Expand the CSS with variant blocks**

Replace the contents of `apps/core-radix-pilot/src/recipes/Tabs/Tabs.css` with:

```css
/* base — applies to all variants */
.cr-Tabs-list {
  display: flex;
  gap: 0.25rem;
}

.cr-Tabs-trigger {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-sm);
  font-weight: 500;
  background: transparent;
  color: var(--text-muted);
  border: none;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease, background 150ms ease;
}
.cr-Tabs-trigger[data-state='active'] {
  color: var(--text-default);
}
.cr-Tabs-trigger:disabled,
.cr-Tabs-trigger[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.cr-Tabs-trigger:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* default — underline-on-active. Matches CVI's existing core-radix style. */
.cr-Tabs-list[data-variant='default'] {
  border-bottom: 1px solid var(--border-default);
}
.cr-Tabs-trigger[data-variant='default'] {
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.cr-Tabs-trigger[data-variant='default'][data-state='active'] {
  border-bottom-color: var(--text-default);
}

/* outline — bordered tabs sharing a list border-bottom */
.cr-Tabs-list[data-variant='outline'] {
  border-bottom: 1px solid var(--border-default);
}
.cr-Tabs-trigger[data-variant='outline'] {
  border: 1px solid transparent;
  border-bottom: none;
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: var(--radius-md);
  margin-bottom: -1px;
}
.cr-Tabs-trigger[data-variant='outline'][data-state='active'] {
  border-color: var(--border-default);
  background: var(--surface-default);
}

/* pills — rounded button-shaped active. Reads --cr-tabs-active-bg/color from vars. */
.cr-Tabs-trigger[data-variant='pills'] {
  border-radius: var(--radius-full);
}
.cr-Tabs-trigger[data-variant='pills'][data-state='active'] {
  background: var(--cr-tabs-active-bg);
  color: var(--cr-tabs-active-color);
}

/* Variant-scoped focus override: pills' filled active state collides with
 * the default outline color (primary-500 on a primary-500 background).
 * Re-route to a contrast-coherent outline. */
.cr-Tabs-trigger[data-variant='pills'][data-state='active']:focus-visible {
  outline-color: var(--color-neutral-0);
  outline-offset: -2px;
}

/* Content — minimal styling; consumer composes inside. */
.cr-Tabs-content {
  margin-top: 1rem;
}
.cr-Tabs-content:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: PASS (9 tests).

- [ ] **Step 6: Verify the CSS references that exist in the theme**

Some of the CSS references CSS vars that must exist in the pilot's emitted token CSS: `--text-muted`, `--text-default`, `--border-default`, `--surface-default`, `--color-primary-500`, `--color-neutral-0`, `--radius-md`, `--radius-full`, `--font-size-sm`. The pilot's theme already ships these from Wave 1/2.

Quick grep to confirm:

```bash
grep -E '^\s*--(text-(muted|default)|border-default|surface-default|color-primary-500|color-neutral-0|radius-(md|full)|font-size-sm):' /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot/src/generated/theme.css 2>&1 | head -20
```

Expected: each var has at least one match. If any are missing, stop — the pilot's theme is incomplete for this recipe; do not paper over with hardcoded values.

If `--surface-default-foreground` is missing (referenced via the fallback `var(--surface-default-foreground, var(--color-neutral-0))` in the recipe), that's fine — the fallback is the actual rendered value.

- [ ] **Step 7: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/recipes/Tabs/ && git -C /Users/matt/Documents/GitHub/soribashi commit -m "feat(wave-3): variant CSS + vars resolver for Tabs (default/outline/pills)"
```

---

## Task 6: Polymorphic Trigger exercise — `as="a"` + ref forwarding

**This is the highest-risk surface in Wave 3.** `PolymorphicPartConfig` has factory-level tests but no recipe has exercised it before. If this task goes green, the polymorphic-part API is proven end-to-end.

**Files:**
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx`

No recipe changes — Trigger is already polymorphic per Task 3.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe`:

```tsx
  it('Tabs.Trigger defaults to a <button> element', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const tab = screen.getByRole('tab', { name: 'A' });
    expect(tab.tagName).toBe('BUTTON');
  });

  it('Tabs.Trigger with as="a" renders an anchor element', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a" as="a" href="/dashboard">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const tab = screen.getByRole('tab', { name: 'A' });
    expect(tab.tagName).toBe('A');
    expect(tab).toHaveAttribute('href', '/dashboard');
    expect(tab).toHaveAttribute('data-state', 'active');
  });

  it('Tabs.Trigger forwards refs to the rendered button (default element)', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a" ref={ref}>A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('Tabs.Trigger forwards refs to the rendered anchor when as="a"', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a" as="a" href="/x" ref={ref}>A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('A');
    expect(ref.current?.getAttribute('href')).toBe('/x');
  });
```

Add `createRef` to the React import at the top:

```tsx
import { createRef } from 'react';
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: PASS (13 tests).

**If any of the polymorphic tests fail**, this is the high-risk surface. Common failure modes:

- `as="a"` ignored, renders `<button>` anyway → `PolymorphicPartConfig` plumbing is broken. Check `packages/factory/src/define-compound.tsx` to see how `Element` is resolved in `PolymorphicPartRenderCtx`. The Wave 2 spec § 3.2 said it mirrors `definePolymorphicComponent`. Compare against `definePolymorphicComponent`'s working `as` handling in `packages/factory/test/define-polymorphic-component.test.tsx`.
- Ref is `null` → the recipe forgot to pass `ref={ref}` to `<Element>`. Check Tabs.tsx Trigger render — Wave 1 Gap 7 (silent ref-drop) is the canary; should be wired per the recipe sketch.
- Ref points to the wrong element (e.g., RadixTabs.Trigger DOM wrapper instead of `<Element>`) → Radix Slot is consuming the ref. Solution: the Slot pattern requires the ref to be on the `<Element>` (the child of Slot), which is correct in the recipe sketch. If Radix's mergeRefs is interfering, the recipe is correct and the issue is in `defineCompound`'s polymorphic plumbing.

If broken, DO NOT add a workaround in the recipe. Investigate the factory or Slot interaction and fix at the right level. The recipe is the right shape.

- [ ] **Step 3: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx && git -C /Users/matt/Documents/GitHub/soribashi commit -m "test(wave-3): polymorphic Trigger — as=\"a\" + ref forwarding"
```

---

## Task 7: Edge cases — disabled, forceMount, safe-context throws

**Files:**
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append inside the `describe`:

```tsx
  it('disabled Trigger does not fire onValueChange when clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      withProviders(
        <Tabs defaultValue="a" onValueChange={onValueChange}>
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b" disabled>B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText('content-a')).toBeInTheDocument();
  });

  it('disabled Trigger is skipped by arrow-key navigation', async () => {
    const user = userEvent.setup();
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b" disabled>B</Tabs.Trigger>
            <Tabs.Trigger value="c">C</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
          <Tabs.Content value="c">content-c</Tabs.Content>
        </Tabs>,
      ),
    );

    screen.getByRole('tab', { name: 'A' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'C' })).toHaveFocus();
  });

  it('forceMount keeps inactive Content mounted in DOM', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b" forceMount>content-b</Tabs.Content>
        </Tabs>,
      ),
    );

    // Active content is visible
    expect(screen.getByText('content-a')).toBeInTheDocument();
    // Inactive but forceMount'd content is still in DOM (hidden via Radix's `hidden` attr)
    expect(screen.getByText('content-b')).toBeInTheDocument();
    expect(screen.getByText('content-b').closest('[role="tabpanel"]'))
      .toHaveAttribute('data-state', 'inactive');
  });

  it('throws when Tabs.Trigger is rendered outside <Tabs>', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Tabs.Trigger value="a">orphan</Tabs.Trigger>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Tabs\.Trigger> must be inside <Tabs>/);
  });

  it('throws when Tabs.Content is rendered outside <Tabs>', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Tabs.Content value="a">orphan</Tabs.Content>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Tabs\.Content> must be inside <Tabs>/);
  });

  it('throws when Tabs.List is rendered outside <Tabs>', () => {
    expect(() =>
      render(
        <SoribashiProvider theme={theme}>
          <Tabs.List>orphan</Tabs.List>
        </SoribashiProvider>,
      ),
    ).toThrow(/<Tabs\.List> must be inside <Tabs>/);
  });
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: PASS (19 tests).

**Notes:**

- The exact error message in the safe-context throws comes from the factory's `createSafeContext`, which embeds the part name. Wave 2's Tooltip test asserted `/<Tooltip\.Trigger> must be inside <Tooltip>/` — Wave 3 mirrors that shape. If the message format differs (e.g., factory uses `"Tabs parts must be inside <Tabs>"` instead of per-part naming), adjust the regex to match the actual error.
- The `forceMount` test asserts the inactive panel is in DOM via `screen.getByText` — Radix uses `hidden` attribute, not display:none, so the text is queryable. If Radix changes this in a future version, the test might need to switch to `container.querySelector('[role="tabpanel"][data-state="inactive"]')`.

- [ ] **Step 3: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx && git -C /Users/matt/Documents/GitHub/soribashi commit -m "test(wave-3): edge cases — disabled, forceMount, safe-context throws"
```

---

## Task 8: Styles-API plumbing — className + withDefaults round-trip

**Files:**
- Modify: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx`

These are the same tests Wave 2's Tooltip used (last two `it` blocks in `Tooltip.test.tsx`). Verifies the framework-level plumbing works through the recipe's slot wiring.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe`:

```tsx
  it('className from instance props lands on Tabs.Trigger', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a" className="custom-trigger-class">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const tab = screen.getByRole('tab', { name: 'A' });
    expect(tab.className).toContain('cr-Tabs-trigger');
    expect(tab.className).toContain('custom-trigger-class');
  });

  it('className from instance props lands on Tabs.Content', () => {
    render(
      withProviders(
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a" className="custom-content-class">content-a</Tabs.Content>
        </Tabs>,
      ),
    );

    const panel = screen.getByRole('tabpanel');
    expect(panel.className).toContain('cr-Tabs-content');
    expect(panel.className).toContain('custom-content-class');
  });

  it('Tabs.withDefaults({ variant: "pills" }) round-trips through createTheme', () => {
    const themeWithDefaults = createTheme({
      tokens: theme.tokens,
      semantic: theme.semantic,
      components: [
        Tabs.withDefaults({ variant: 'pills' } as Partial<TabsRootProps>),
      ],
    });
    render(
      <SoribashiProvider theme={themeWithDefaults}>
        <Tabs defaultValue="a">
          <Tabs.List data-testid="list">
            <Tabs.Trigger value="a">A</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
        </Tabs>
      </SoribashiProvider>,
    );

    expect(screen.getByTestId('list')).toHaveAttribute('data-variant', 'pills');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('data-variant', 'pills');
  });

  it('Tabs.Content.withDefaults({ forceMount: true }) round-trips through createTheme', () => {
    const themeWithDefaults = createTheme({
      tokens: theme.tokens,
      semantic: theme.semantic,
      components: [
        Tabs.Content.withDefaults({ forceMount: true } as Partial<TabsContentProps>),
      ],
    });
    render(
      <SoribashiProvider theme={themeWithDefaults}>
        <Tabs defaultValue="a">
          <Tabs.List>
            <Tabs.Trigger value="a">A</Tabs.Trigger>
            <Tabs.Trigger value="b">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">content-a</Tabs.Content>
          <Tabs.Content value="b">content-b</Tabs.Content>
        </Tabs>
      </SoribashiProvider>,
    );

    // Even though 'a' is the active tab, 'b' content is mounted via withDefaults forceMount
    expect(screen.getByText('content-a')).toBeInTheDocument();
    expect(screen.getByText('content-b')).toBeInTheDocument();
  });
```

Update the imports at the top of the test file to include `createTheme` and the recipe's prop types:

```tsx
import { SoribashiProvider, createTheme } from '@soribashi/core';
import { Tabs, type TabsRootProps, type TabsContentProps } from './Tabs.tsx';
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run src/recipes/Tabs/Tabs.test.tsx --reporter=basic
```

Expected: PASS (23 tests).

If the `withDefaults` tests fail with a type error, the recipe needs to export the prop types so the test can use them — the recipe sketch in Task 3 already declared `TabsRootProps`, `TabsListProps`, `TabsTriggerOwnProps`, and `TabsContentProps` with `export`. Verify they're exported.

- [ ] **Step 3: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/recipes/Tabs/ && git -C /Users/matt/Documents/GitHub/soribashi commit -m "test(wave-3): styles-API plumbing — className + withDefaults round-trip"
```

---

## Task 9: `TabsMatrix.tsx` page + `/tabs-matrix` route

**Files:**
- Create: `apps/core-radix-pilot/src/pages/TabsMatrix.tsx`
- Modify: `apps/core-radix-pilot/src/App.tsx`

- [ ] **Step 1: Create the matrix page**

Create `apps/core-radix-pilot/src/pages/TabsMatrix.tsx`:

```tsx
/**
 * TabsMatrix — visual review fixture for Wave 3's Tabs recipe.
 * Renders 3 variants (default | outline | pills) plus four edge-case cells.
 */
import { useState } from 'react';
import { Tabs } from '../recipes/Tabs/Tabs.tsx';

type Variant = 'default' | 'outline' | 'pills';
const VARIANTS: Variant[] = ['default', 'outline', 'pills'];

const SAMPLE_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'usage',    label: 'Usage' },
  { value: 'api',      label: 'API' },
];

function VariantCell({ variant }: { variant: Variant }) {
  return (
    <section style={{ padding: '1rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        variant=&quot;{variant}&quot;
      </h3>
      <Tabs variant={variant} defaultValue="overview">
        <Tabs.List>
          {SAMPLE_TABS.map((t) => (
            <Tabs.Trigger key={t.value} value={t.value}>{t.label}</Tabs.Trigger>
          ))}
        </Tabs.List>
        {SAMPLE_TABS.map((t) => (
          <Tabs.Content key={t.value} value={t.value}>
            <p>This is the {t.label} panel for the {variant} variant.</p>
          </Tabs.Content>
        ))}
      </Tabs>
    </section>
  );
}

function DisabledCell() {
  return (
    <section style={{ padding: '1rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        disabled trigger
      </h3>
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">Enabled</Tabs.Trigger>
          <Tabs.Trigger value="b" disabled>Disabled</Tabs.Trigger>
          <Tabs.Trigger value="c">Also enabled</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A panel</Tabs.Content>
        <Tabs.Content value="b">B panel (unreachable)</Tabs.Content>
        <Tabs.Content value="c">C panel</Tabs.Content>
      </Tabs>
    </section>
  );
}

function ForceMountCell() {
  return (
    <section style={{ padding: '1rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        forceMount panels (both stay in DOM)
      </h3>
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a" forceMount>A — forceMount</Tabs.Content>
        <Tabs.Content value="b" forceMount>B — forceMount</Tabs.Content>
      </Tabs>
    </section>
  );
}

function PolymorphicCell() {
  return (
    <section style={{ padding: '1rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        polymorphic trigger (one is an &lt;a&gt;)
      </h3>
      <Tabs defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">Button trigger</Tabs.Trigger>
          <Tabs.Trigger value="b" as="a" href="#tabs-matrix">Anchor trigger</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A panel</Tabs.Content>
        <Tabs.Content value="b">B panel</Tabs.Content>
      </Tabs>
    </section>
  );
}

function ControlledCell() {
  const [tab, setTab] = useState('a');
  return (
    <section style={{ padding: '1rem', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
      <h3 style={{ marginTop: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        controlled (current value: <code>{tab}</code>)
      </h3>
      <Tabs value={tab} onValueChange={setTab}>
        <Tabs.List>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
          <Tabs.Trigger value="c">C</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">A panel</Tabs.Content>
        <Tabs.Content value="b">B panel</Tabs.Content>
        <Tabs.Content value="c">C panel</Tabs.Content>
      </Tabs>
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
        <button onClick={() => setTab('a')}>Set A</button>
        <button onClick={() => setTab('b')}>Set B</button>
        <button onClick={() => setTab('c')}>Set C</button>
      </div>
    </section>
  );
}

export function TabsMatrix() {
  return (
    <div style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
      <h2 style={{ margin: 0 }}>Tabs matrix</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {VARIANTS.map((v) => <VariantCell key={v} variant={v} />)}
      </div>

      <h3 style={{ margin: 0 }}>Edge cases</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <DisabledCell />
        <ForceMountCell />
        <PolymorphicCell />
        <ControlledCell />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register the route in `App.tsx`**

In `apps/core-radix-pilot/src/App.tsx`, make four edits:

(1) Add the import after the `TooltipMatrix` import:

```tsx
import { TabsMatrix } from './pages/TabsMatrix.tsx';
```

(2) Update the `Page` type:

```tsx
type Page = 'tokens' | 'screen' | 'buttons' | 'tooltips' | 'tabs';
```

(3) Add the nav button after the Tooltip button (inside `<header>`):

```tsx
            <button onClick={() => setPage('tabs')} aria-current={page === 'tabs' ? 'page' : undefined}>
              Tabs matrix
            </button>
```

(4) Add the page render in `<main>`:

```tsx
            {page === 'tabs' && <TabsMatrix />}
```

- [ ] **Step 3: Run the dev server and visually verify**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bun run dev
```

Open the URL it prints (typically `http://localhost:5173/`), click **Tabs matrix** in the header. Visually verify:

- Three variant cells render side-by-side (or wrapped per viewport): default with underline, outline with bordered active tab, pills with rounded active button.
- Disabled cell: clicking the disabled tab does nothing; tab is visibly faded.
- ForceMount cell: both panels appear visible (no panel-switch animation needed; they're both `forceMount`).
- Polymorphic cell: the second tab is an `<a href="#tabs-matrix">`; right-clicking it shows the anchor context menu (i.e., it's a real anchor).
- Controlled cell: clicking the **Set A/B/C** buttons switches the active tab; clicking a tab updates the displayed current-value code.
- Toggle the **Dark** button in the header — every cell should re-render with the dark theme colors. Tabs styling should remain legible.

Take a screenshot grid (light + dark) for the journal.

Kill the dev server with Ctrl-C when done.

- [ ] **Step 4: Run typecheck**

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run typecheck
```

Expected: clean.

- [ ] **Step 5: Run all pilot tests one more time**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run --reporter=basic
```

Expected: previous Tooltip tests (24) + new Tabs tests (23) = **47 tests pass**.

- [ ] **Step 6: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/pages/TabsMatrix.tsx apps/core-radix-pilot/src/App.tsx && git -C /Users/matt/Documents/GitHub/soribashi commit -m "feat(wave-3): TabsMatrix page + /tabs-matrix route"
```

---

## Task 10: `ScreenReplica.tsx` Tabs region

**Files:**
- Modify: `apps/core-radix-pilot/src/pages/ScreenReplica.tsx`

The Tabs region in ScreenReplica is the "would this work at a CVI-realistic location?" smoke. Pick a spot that mirrors `apps/adjuster/src/components/ClaimViewIslands/islands/auto/RightToolbar/components/PanelTabs.tsx` — a side-panel tab strip with 2-3 tabs.

- [ ] **Step 1: Read the current ScreenReplica to find an integration point**

```bash
wc -l /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot/src/pages/ScreenReplica.tsx
```

Then read the file (or open in IDE). Find an existing region that looks like a "panel" or "card with sections" — ideally a content area where switching between 2-3 views fits the page's existing visual rhythm.

- [ ] **Step 2: Add a Tabs region**

In a logical spot (e.g., inside a side-panel card or a content section), insert:

```tsx
<Tabs defaultValue="details">
  <Tabs.List>
    <Tabs.Trigger value="details">Details</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
    <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="details">
    {/* Some existing content from ScreenReplica goes here, or a short stub */}
    <p style={{ color: 'var(--text-default)' }}>Claim details placeholder.</p>
  </Tabs.Content>
  <Tabs.Content value="activity">
    <p style={{ color: 'var(--text-default)' }}>Activity feed placeholder.</p>
  </Tabs.Content>
  <Tabs.Content value="notes">
    <p style={{ color: 'var(--text-default)' }}>Notes placeholder.</p>
  </Tabs.Content>
</Tabs>
```

Add the import at the top of `ScreenReplica.tsx`:

```tsx
import { Tabs } from '../recipes/Tabs/Tabs.tsx';
```

Use the `default` variant (don't pass `variant`) — it matches CVI's existing styling.

- [ ] **Step 3: Visually verify in the dev server**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bun run dev
```

Click **Screen replica** in the header. The new Tabs region should render and tabs should switch. Toggle dark mode. Screenshot for the journal.

Kill the dev server with Ctrl-C.

- [ ] **Step 4: Re-run typecheck and tests**

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run typecheck && cd apps/core-radix-pilot && bunx vitest run --reporter=basic
```

Expected: clean typecheck, 47/47 tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add apps/core-radix-pilot/src/pages/ScreenReplica.tsx && git -C /Users/matt/Documents/GitHub/soribashi commit -m "feat(wave-3): integrate Tabs into ScreenReplica"
```

---

## Task 11: Playbook § 2.3 entry

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md`

Populate the placeholder `### 2.3 Persistent navigational compound (Wave 3 — Tabs)` section. Mirror Wave 2's § 2.2 structure (recipe shape, style approach, state handling, three-classes-of-part recap, render-body destructure, tests, recipe code snippet).

- [ ] **Step 1: Locate the placeholder**

The file currently has:

```markdown
### 2.3 Persistent navigational compound (Wave 3 — Tabs)

_To be populated by Wave 3._
```

That line is near line 559-561 of the playbook (line numbers may have shifted; grep for the section header).

- [ ] **Step 2: Replace with the populated entry**

Replace the placeholder with:

````markdown
### 2.3 Persistent navigational compound (Wave 3 — Tabs)

Pattern for components with Radix anatomy, sibling parts in the same DOM tree (no portal), persistent active-state, and controlled-value passthrough — tabs, segmented controls, breadcrumb-like patterns.

**Examples in core-radix:** Tabs, SegmentedControl.

#### Recipe shape

Use `defineCompound` (from `@soribashi/core`). The config shape parallels Wave 2's Tooltip with three notable differences: (1) no `Provider` part — Radix Tabs has no app-level shared state, so the compound is item-flat with four parts (Root / List / Trigger / Content); (2) `Tabs.Trigger` is **polymorphic** via `PolymorphicPartConfig` — the wave's first recipe exercise of that API; (3) the safe-context's `context()` returns an empty extras object because Radix's Tabs.Root owns active-value internally, and Triggers/Contents read it through Radix's own context — no soribashi-side state to thread.

**Parts taxonomy — Tabs has four parts:**

| Part | Class | Role |
|---|---|---|
| `root` | Class-1 context-creator | Establishes compound context via `RadixTabs.Root`. Owns `variant` + controlled `value` / `defaultValue` / `onValueChange`. Emits `data-variant` for descendant CSS. |
| `list` | Class-2 context-consumer | Wraps `RadixTabs.List`. Reads `ctx.variant` for variant-driven list styling. |
| `trigger` | Class-2 + polymorphic | Wraps `RadixTabs.Trigger` (asChild). Polymorphic with `defaultElement: 'button'`. Consumer chooses element via `as` prop; recipe never exposes Radix's `asChild` publicly. |
| `content` | Class-2 context-consumer | Wraps `RadixTabs.Content`. `forceMount` passthrough for keep-mounted panels. |

**Polymorphic part API (new in Wave 3 — the first recipe to exercise it).** Declared with `polymorphic: true` and `defaultElement: 'button'`. The part's render takes `PolymorphicPartRenderCtx<TOwnProps, TDefaultAs, TCtxExtra>` and destructures `Element`, `ref` alongside the usual `getStyles`, `ctx`, `props`, `children`. The render emits `<Element ref={ref} {...getStyles()}>{children}</Element>` — same shape as `definePolymorphicComponent` recipes.

**Why polymorphic AND wrap-Radix interact via Slot.** `RadixTabs.Trigger` needs to be the element receiving Radix's state-machine props (`data-state`, `aria-selected`, click handler, keyboard handlers). When the consumer's `<Element>` is custom (e.g., `as="a"`), the recipe always wraps the `<Element>` inside `<RadixTabs.Trigger asChild>{<Element>}</RadixTabs.Trigger>` — Radix's own Slot merges Radix's props onto `<Element>`. This means `asChild` is a **recipe-internal detail**, not a public prop. Public polymorphism is via `as`; passing the consumer a custom component is also expressible via `as={CustomComponent}`. This is a deliberate API divergence from Wave 2's Tooltip (which kept public `asChild`): Tabs.Trigger's job is to render a trigger element, and `as` expresses that more directly than `asChild`.

**Polymorphic Trigger with non-button elements.** When `as="a"` (or any non-button), Radix forwards `disabled` onto the element. `<a disabled>` is non-spec — anchors ignore the attribute. Consumers using polymorphic Trigger with non-button elements should add `aria-disabled` manually if they need disabled semantics. The recipe doesn't poly-fill this — CVI uses button-only.

#### Style approach

Same `data-attribute selector + vars-resolver` hybrid Wave 1 used for Button. Each part emits `data-variant={ctx.variant}` (Root emits its own); CSS rules combine `[data-variant='X'][data-state='active']` for active-cell styling. The `vars` resolver carries only the per-variant *token* values that CSS can't hardcode (the active-pill bg/fg, where the cell's tokens differ from the chrome above).

```ts
vars: (_theme, props) => ({
  list: {
    '--cr-tabs-active-bg':
      props.variant === 'pills' ? 'var(--color-primary-500)' : 'transparent',
    '--cr-tabs-active-color':
      props.variant === 'pills'
        ? 'var(--surface-default-foreground, var(--color-neutral-0))'
        : 'var(--text-default)',
  },
}),
```

The pills variant's filled active state collides with the default `--color-primary-500` outline color. Variant-scoped focus override re-routes to a contrast-coherent outline:

```css
.cr-Tabs-trigger[data-variant='pills'][data-state='active']:focus-visible {
  outline-color: var(--color-neutral-0);
  outline-offset: -2px;
}
```

This is the same pattern Wave 1 used for Button's transparent variants — reuse for any future recipe with a filled active state.

#### State handling

Radix Tabs owns active-value entirely. `data-state="active"` / `data-state="inactive"` attributes are emitted by Radix directly. The recipe has **no state-toggle code** — no `useState`, no `useUncontrolled`. The `config.context()` callback returns an empty extras object; active-value is not surfaced through soribashi's context because Triggers/Contents read it via Radix's internal context (which Radix uses to match `Trigger.value === Root.value` and emit `data-state`).

This is the defining characteristic of the persistent-navigational category as wrapped on top of Radix: the recipe author handles styling + variant routing + the polymorphic-Trigger seam; Radix handles state + keyboard + a11y. Contrast with Wave 2's Tooltip (transient overlay — Radix also owns the open/close lifecycle but soribashi's context surfaced `side` and `sideOffset` because the recipe needed them for Content placement).

#### Token consumption

The Tabs recipe consumes Wave-1 / Wave-2 semantic tokens unchanged — no new surface needed. `surface.default` (pills active), `text.default` / `text.muted` (trigger fg states), `border.default` (list bottom-border, outline variant), `color.primary.500` (focus ring + pills active bg), `radius.md` / `radius.full`. The pilot's `default` variant deliberately tracks CVI's existing styling so integration is a near-drop-in.

#### Three classes of part — recap

Same taxonomy as Wave 2:

- **Class 1 — Root.** `Tabs` (the Root). Owns variant and controlled-value props; establishes the safe-context.
- **Class 2 — Context-consuming.** `Tabs.List`, `Tabs.Trigger`, `Tabs.Content` — all read `ctx.variant`. `Tabs.Trigger` additionally declares `polymorphic: true`.
- **Class 3 — Passthrough.** None in Tabs. Radix Tabs has no equivalent of `RadixTooltip.Provider`. The four-part anatomy is item-flat.

When authoring a new compound: start with Class 2 for every part; downgrade to Class 3 only if the part genuinely must live outside the compound context tree.

#### Render body destructure

`defineCompound` parts receive a render ctx with `{ props, getStyles, ctx, children }`. Polymorphic parts add `Element` and `ref`. Each part destructures only what it needs and never forwards the raw `props` object to a DOM element.

```tsx
trigger: {
  polymorphic: true,
  defaultElement: 'button',
  render: ({
    Element, ref, getStyles, ctx, props, children,
  }: PolymorphicPartRenderCtx<TabsTriggerOwnProps, 'button', TabsCtxExtras>) => (
    <RadixTabs.Trigger asChild value={props.value} disabled={props.disabled}>
      <Element ref={ref} data-variant={ctx.variant} {...getStyles()}>
        {children}
      </Element>
    </RadixTabs.Trigger>
  ),
},
```

#### Tests

- **Vitest behavior** (Wave 3 reference: `apps/core-radix-pilot/src/recipes/Tabs/Tabs.test.tsx`): render lifecycle (defaultValue / data-state); controlled mode round-trip; keyboard arrow-nav + skip-disabled; three variants apply `data-variant`; pills vars resolve; polymorphic Trigger renders `<button>` by default and `<a>` with `as="a"`; ref forwarding to both default and polymorphic elements; disabled Trigger skipped by nav + clicks; forceMount keeps inactive Content in DOM; safe-context throws for each part rendered outside Root; className from instance props lands; `Tabs.withDefaults` + `Tabs.Content.withDefaults` round-trip through `createTheme`. ~23 tests.
- **Playwright parity** (Wave 3 reference: deferable; vitest covers ~95% of the surface). If wired, per-variant computed-style assertions across the matrix + keyboard nav + dark-mode toggle.
- **Manual visual** — non-optional. Variant matrix in light + dark; focus-ring visibility per variant (especially the pills active-state contrast-coherent override); polymorphic anchor Trigger in DevTools (verifies real `<a>` element); dark-mode toggle redraws all cells correctly.

#### Recipe code snippet

```tsx
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import {
  defineCompound,
  type PartRenderCtx,
  type PolymorphicPartRenderCtx,
} from '@soribashi/core';
import './Tabs.css';

type Variant = 'default' | 'outline' | 'pills';

export interface TabsRootProps {
  variant?: Variant;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}
export interface TabsListProps    { children?: ReactNode }
export interface TabsTriggerOwnProps {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
}
export interface TabsContentProps {
  value: string;
  forceMount?: boolean;
  children?: ReactNode;
}

interface TabsCtxExtras {}  // Radix owns active-value; nothing to surface.

export const Tabs = defineCompound({
  name: 'Tabs',
  variants: ['default', 'outline', 'pills'] as const,
  classes: {
    root: 'cr-Tabs-root', list: 'cr-Tabs-list',
    trigger: 'cr-Tabs-trigger', content: 'cr-Tabs-content',
  },
  defaults: { variant: 'default' } as Partial<TabsRootProps>,
  vars: (_theme, props) => ({
    list: {
      '--cr-tabs-active-bg':
        props.variant === 'pills' ? 'var(--color-primary-500)' : 'transparent',
      '--cr-tabs-active-color':
        props.variant === 'pills'
          ? 'var(--surface-default-foreground, var(--color-neutral-0))'
          : 'var(--text-default)',
    },
  }),
  context: (_rootProps) => ({} as TabsCtxExtras),
  parts: {
    root: {
      render: ({ props, children }: PartRenderCtx<TabsRootProps, TabsCtxExtras>) => (
        <RadixTabs.Root
          value={props.value} defaultValue={props.defaultValue}
          onValueChange={props.onValueChange} data-variant={props.variant}
        >
          {children}
        </RadixTabs.Root>
      ),
    },
    list: {
      render: ({ getStyles, ctx, children }: PartRenderCtx<TabsListProps, TabsCtxExtras>) => (
        <RadixTabs.List data-variant={ctx.variant} {...getStyles()}>
          {children}
        </RadixTabs.List>
      ),
    },
    trigger: {
      polymorphic: true,
      defaultElement: 'button',
      render: ({
        Element, ref, getStyles, ctx, props, children,
      }: PolymorphicPartRenderCtx<TabsTriggerOwnProps, 'button', TabsCtxExtras>) => (
        <RadixTabs.Trigger asChild value={props.value} disabled={props.disabled}>
          <Element ref={ref} data-variant={ctx.variant} {...getStyles()}>
            {children}
          </Element>
        </RadixTabs.Trigger>
      ),
    },
    content: {
      render: ({ getStyles, props, children }: PartRenderCtx<TabsContentProps, TabsCtxExtras>) => (
        <RadixTabs.Content
          value={props.value} forceMount={props.forceMount} {...getStyles()}
        >
          {children}
        </RadixTabs.Content>
      ),
    },
  },
});
```

See `apps/core-radix-pilot/src/recipes/Tabs/Tabs.tsx` for the live source (snippet verbatim as of Wave 3).
````

- [ ] **Step 3: Commit**

```bash
git -C /Users/matt/Documents/GitHub/soribashi add docs/superpowers/specs/2026-04-26-core-radix-conversion-playbook.md && git -C /Users/matt/Documents/GitHub/soribashi commit -m "docs(playbook): populate § 2.3 — persistent navigational compound (Tabs)"
```

---

## Task 12: Final verification + PR

**Files:** none (verification + PR creation)

- [ ] **Step 1: Final typecheck + full test sweep**

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run typecheck
```

Expected: clean.

```bash
cd /Users/matt/Documents/GitHub/soribashi && bun run --filter '@soribashi/*' test
```

Expected: 460 factory + 244 blocks = 704 tests pass.

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bunx vitest run --reporter=basic
```

Expected: **47 tests pass** (24 prior + 23 new Tabs).

- [ ] **Step 2: Last visual review pass**

```bash
cd /Users/matt/Documents/GitHub/soribashi/apps/core-radix-pilot && bun run dev
```

Hit `http://localhost:5173/`. Click through every page (Tokens, Screen replica, Button matrix, Tooltip matrix, Tabs matrix) in light + dark. The Tabs matrix should look clean; the new Tabs region in Screen replica should fit.

Kill server (Ctrl-C).

- [ ] **Step 3: Push the branch and open the PR**

```bash
git -C /Users/matt/Documents/GitHub/soribashi push -u origin wave-3-tabs-pilot
```

Then open the PR via `gh pr create`:

```bash
cd /Users/matt/Documents/GitHub/soribashi && gh pr create --title "feat: Wave 3 — Tabs pilot (persistent navigational compound)" --body "$(cat <<'EOF'
## Summary

- Ships the Wave 3 pilot recipe `Tabs` at `apps/core-radix-pilot/src/recipes/Tabs/` — a 4-part `defineCompound` wrapping `@radix-ui/react-tabs`.
- Three Mantine-parity variants (`default | outline | pills`), horizontal orientation only (matches CVI).
- `Tabs.Trigger` is **polymorphic** (`defaultElement: 'button'`) — the first recipe to exercise `PolymorphicPartConfig`. Public polymorphism via `as` prop; recipe internally uses Radix's `asChild` so Radix's state-machine props merge onto the consumer's `<Element>`. No public `asChild` (deliberate divergence from Wave 2's Tooltip).
- Adds a `TabsMatrix` page (variants + 4 edge-case cells: disabled, forceMount, polymorphic-anchor, controlled) and integrates a Tabs region into `ScreenReplica`.
- Populates playbook § 2.3 with the persistent-navigational-compound authoring pattern.

Spec: `docs/superpowers/specs/2026-05-10-wave-3-tabs-pilot-design.md` (commit 47275e1).

## Test plan

- [ ] `bun run typecheck` clean
- [ ] `bun run --filter '@soribashi/*' test` — 704 tests pass (no regressions)
- [ ] `cd apps/core-radix-pilot && bunx vitest run` — 47 tests pass (24 prior + 23 new Tabs)
- [ ] Manual: Tabs matrix renders all 3 variants + 4 edge-case cells in light + dark
- [ ] Manual: ScreenReplica Tabs region renders + switches
- [ ] Manual: polymorphic anchor Trigger DevTools-verified as real `<a>` element

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Request reviews from both Copilot and CodeRabbit**

After the PR is open, on GitHub:
1. Assign **Copilot** as a reviewer.
2. **CodeRabbit** should auto-assign if it's configured at the repo level; if not, comment `@coderabbitai review` on the PR to trigger it.

Process lesson from Wave 2: do BOTH in the first review round. They find different things. Don't sequence them — run them in parallel.

- [ ] **Step 5: Wait for both reviews; bundle feedback**

Once both have commented, do a single pass that addresses all of round 1 (Copilot + CodeRabbit combined). For each finding:
1. Read the comment.
2. Look for the broader class — if the finding flags one cell, check the whole matrix.
3. Fix in one careful pass; don't iterate per-comment.

Commit per logical fix group (one commit per class of issue, not one commit per comment).

- [ ] **Step 6: Stop reviewing after round 2-3**

Process lesson from Wave 2: knock-on rate climbs to 25-66% by round 3-4. After 2-3 substantive rounds, the marginal real-bug-caught rate drops below the diff-noise cost. Bundle remaining smaller feedback into one final pass and merge.

- [ ] **Step 7: Merge after both reviewers + you are satisfied**

Standard squash-and-merge (per repo convention — match how Wave 2's PR #7 landed). After merge, delete the branch (`gh pr merge --squash --delete-branch`).

---

## Post-merge

The Wave 3 spec § 11 OQs are deferred to either visual review during implementation (OQ-1 focus ring) or future waves (OQ-3 vertical orientation, OQ-4 aria-disabled polyfill, OQ-5 token mapping for CVI integration, OQ-6 tabIndex exposure). None of them block merge.

After merge, write a Wave 3 handoff journal at `docs/superpowers/sessions/YYYY-MM-DD-wave-3-handoff-followup.md` if there are unresolved learnings to capture for Wave 4 (Select). The pattern is the existing `docs/superpowers/sessions/2026-04-28-handoff.md` and `docs/superpowers/sessions/2026-05-09-wave-3-handoff.md`.

Wave 4 (Select) inherits the polymorphic-part API exercise from this wave; the next handoff should call out any quirks or gotchas surfaced during Wave 3's polymorphic Trigger work.
