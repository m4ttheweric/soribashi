/**
 * Compile-time assertions that the theme's vocabulary literals reach the
 * recipes' PUBLIC types via packages/ui/src/builders.ts (makeBuilders).
 * Never executed: bun run typecheck is the gate. One assertion per builder
 * kind that carries a global axis, plus a regression pin that variant's
 * tuple-driven narrowing survived the migration. If any @ts-expect-error
 * line reports "Unused '@ts-expect-error' directive", narrowing is NOT
 * reaching that recipe's public type and the spike has not landed.
 */
import type { JSX } from 'react';
import { Button } from '../src/recipes/Button/Button.tsx';
import { Checkbox } from '../src/recipes/Checkbox/Checkbox.tsx';
import { Select } from '../src/recipes/Select/Select.tsx';
import { Tabs } from '../src/recipes/Tabs/Tabs.tsx';

export const narrowedSize: JSX.Element = <Button size="md">ok</Button>;
// @ts-expect-error size narrows to the theme's literals (definePolymorphicComponent path)
export const rejectedSize: JSX.Element = <Button size="banana">no</Button>;

export const narrowedIntent: JSX.Element = <Checkbox intent="danger" label="ok" />;
// @ts-expect-error intent narrows to the theme's literals (defineComponent path)
export const rejectedIntent: JSX.Element = <Checkbox intent="sparkly" label="no" />;

// Select already narrows size via its hand-declared type (the slice 3
// workaround); this pins that the migrated path preserves it.
// @ts-expect-error size stays narrowed on the defineGenericComponent path
export const rejectedGenericSize: JSX.Element = <Select items={[]} size="banana" />;

// variant narrowed BEFORE this task via the builder tuple; pin no regression.
// @ts-expect-error out-of-tuple variant stays rejected on the compound path
export const rejectedVariant: JSX.Element = <Tabs.Root variant="zigzag" />;
