import type { ReactNode } from 'react';
import { Box } from '../recipes/Box/Box.tsx';
import { Button } from '../recipes/Button/Button.tsx';
import { Popover } from '../recipes/Popover/Popover.tsx';
import { Stack } from '../recipes/Stack/Stack.tsx';

/**
 * One minimal, force-visible rendering per recipe, keyed by the recipe's
 * `recipeMeta.name` (see `getRecipeMeta` from `@soribashi/core`) rather than
 * the barrel's export name, since `reskin.test.tsx`'s guard test iterates
 * `recipeMeta.name`. `reskin.test.tsx` mounts every fixture directly into a
 * DOM node it controls (`scopeEl`), once under the default theme and once
 * inside a `.reskin-b`-scoped node under themeB, then diffs computed styles
 * on whichever element carries the `reskin-target` class.
 *
 * Convention every fixture below follows, and every future one must too:
 *   1. Mark the recipe's most visually representative slot with
 *      `classNames={{ <slot>: 'reskin-target' }}` (the Styles API every
 *      recipe already exposes), so the test can find it without any
 *      recipe-specific query logic.
 *   2. Forward `scopeEl` to any part that renders through a portal (e.g.
 *      Popover's `Content` -> `container`). A default portal escapes to
 *      `<body>`, outside the `.reskin-b` wrapper, which would leave the
 *      portalled content rendered against the BASE theme even during the
 *      "themeB" render, silently comparing base-theme against base-theme
 *      (a false failure, or worse, a false pass if the two renders happen to
 *      already differ for some unrelated reason).
 */
export const RESKIN_FIXTURES: Record<string, (scopeEl: HTMLElement) => ReactNode> = {
  Box: () => (
    <Box className="reskin-target" bg="surface.raised" p="md">
      x
    </Box>
  ),

  Button: () => <Button classNames={{ root: 'reskin-target' }}>x</Button>,

  Popover: (scopeEl) => (
    <Popover.Root open onOpenChange={() => {}}>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content container={scopeEl} classNames={{ popup: 'reskin-target' }}>
        <Popover.Title>Title</Popover.Title>
      </Popover.Content>
    </Popover.Root>
  ),

  Stack: () => (
    <Stack className="reskin-target" gap="md">
      <div>a</div>
      <div>b</div>
    </Stack>
  ),
};
