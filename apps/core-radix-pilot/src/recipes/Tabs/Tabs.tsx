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
import type { ElementType, ReactNode } from 'react';
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

export interface TabsListProps {
  children?: ReactNode;
}

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
      }: PolymorphicPartRenderCtx<TabsTriggerOwnProps, TabsCtxExtras>) => {
        const Tag = Element as ElementType;
        return (
          <RadixTabs.Trigger asChild value={props.value} disabled={props.disabled}>
            <Tag ref={ref} data-variant={ctx.variant} {...getStyles()}>
              {children}
            </Tag>
          </RadixTabs.Trigger>
        );
      },
    },
    content: {
      render: ({
        getStyles,
        props,
        children,
      }: PartRenderCtx<TabsContentProps, TabsCtxExtras>) => (
        <RadixTabs.Content
          value={props.value}
          forceMount={props.forceMount || undefined}
          {...getStyles()}
        >
          {children}
        </RadixTabs.Content>
      ),
    },
  },
});
