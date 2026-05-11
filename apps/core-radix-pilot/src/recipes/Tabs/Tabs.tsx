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
      render: ({ props, getStyles, ctx, children }: PartRenderCtx<TabsListProps, TabsCtxExtras>) => (
        <RadixTabs.List data-variant={ctx.variant} {...props} {...getStyles()}>
          {children}
        </RadixTabs.List>
      ),
    },
  },
});
