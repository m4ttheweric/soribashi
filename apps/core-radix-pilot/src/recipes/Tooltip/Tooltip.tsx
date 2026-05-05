/**
 * Tooltip recipe — Wave 2 pilot for the transient-overlay compound category.
 *
 * Authored with `defineCompound` from @soribashi/core (re-exported from
 * @soribashi/factory). Wraps @radix-ui/react-tooltip and exercises:
 *   - defineCompound with four parts: Provider, Root, Trigger, Content
 *   - surface.floating formalized foreground pairing (Wave 2 semantic token)
 *   - Passthrough part (Provider — class-3, renders outside compound context)
 *   - asChild forwarding via RadixTooltip.Trigger
 *   - Portal rendering via RadixTooltip.Portal
 *   - Optional arrow via getStyles({ part: 'arrow' }) cross-slot targeting
 *
 * Spec: docs/superpowers/specs/2026-05-04-wave-2-tooltip-pilot-design.md § 6
 * Journal: docs/superpowers/pilots/2026-05-04-tooltip-pilot.md
 */
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { defineCompound } from '@soribashi/core';
import './Tooltip.css';

type Variant = 'default' | 'inverted';
type Side = 'top' | 'right' | 'bottom' | 'left';

interface TooltipRootProps {
  variant?: Variant;
  side?: Side;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  [key: string]: unknown;
}

interface TooltipProviderProps {
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
  children?: ReactNode;
  [key: string]: unknown;
}

interface TooltipTriggerProps {
  asChild?: boolean;
  children?: ReactNode;
  [key: string]: unknown;
}

interface TooltipContentProps {
  withArrow?: boolean;
  sideOffset?: number;
  children?: ReactNode;
  [key: string]: unknown;
}

interface TooltipCtxExtras {
  side: Side;
  sideOffset: number;
}

export const Tooltip = defineCompound<
  TooltipRootProps,
  // Parts type — using Record to satisfy the constraint; actual shape is
  // declared inline below.
  Record<string, never>,
  readonly ['default', 'inverted'],
  TooltipCtxExtras
>({
  name: 'Tooltip',
  variants: ['default', 'inverted'] as const,
  classes: {
    root: 'cr-Tooltip-root',
    trigger: 'cr-Tooltip-trigger',
    content: 'cr-Tooltip-content',
    arrow: 'cr-Tooltip-arrow',
  },
  defaults: { variant: 'default', side: 'top' } as Partial<TooltipRootProps>,
  vars: (_theme, props) => ({
    content: {
      '--cr-tooltip-bg':
        props.variant === 'inverted'
          ? 'var(--surface-floating)'
          : 'var(--surface-default)',
      '--cr-tooltip-color':
        props.variant === 'inverted'
          ? 'var(--surface-floating-foreground)'
          : 'var(--text-default)',
    },
  }),
  context: (rootProps) => ({
    side: rootProps.side ?? 'top',
    sideOffset: 4,
  }),
  parts: {
    // Provider — class-3 passthrough: renders outside compound context without
    // throwing. Delegates to RadixTooltip.Provider for the delay-duration
    // state machine shared across multiple Tooltip instances.
    provider: {
      render: ({ props, children }) => (
        <RadixTooltip.Provider
          delayDuration={(props as TooltipProviderProps).delayDuration}
          skipDelayDuration={(props as TooltipProviderProps).skipDelayDuration}
          disableHoverableContent={(props as TooltipProviderProps).disableHoverableContent}
        >
          {children}
        </RadixTooltip.Provider>
      ),
    },
    // Root — establishes the compound context. Wraps RadixTooltip.Root for
    // open/close state management.
    root: {
      render: ({ props, children }) => (
        <RadixTooltip.Root
          defaultOpen={(props as TooltipRootProps).defaultOpen}
          open={(props as TooltipRootProps).open}
          onOpenChange={(props as TooltipRootProps).onOpenChange}
        >
          {children}
        </RadixTooltip.Root>
      ),
    },
    // Trigger — class-2 part. Reads ctx via getStyles (throws outside Root).
    // asChild merges trigger class onto the provided child element.
    trigger: {
      render: ({ getStyles, props, children }) => {
        const triggerProps = props as TooltipTriggerProps;
        if (triggerProps.asChild) {
          // asChild: Radix Trigger renders as a Slot, merging its props
          // (including our className) onto the single child element.
          return (
            <RadixTooltip.Trigger asChild {...getStyles()}>
              {children}
            </RadixTooltip.Trigger>
          );
        }
        return (
          <RadixTooltip.Trigger {...getStyles()}>
            {children}
          </RadixTooltip.Trigger>
        );
      },
    },
    // Content — class-2 part. Reads ctx for side + sideOffset. Renders inside
    // a Portal so content appears in document.body. Optional Arrow uses
    // cross-slot getStyles({ part: 'arrow' }).
    content: {
      render: ({ getStyles, props, ctx, children }) => {
        const contentProps = props as TooltipContentProps;
        const showArrow = contentProps.withArrow !== false;
        return (
          <RadixTooltip.Portal>
            <RadixTooltip.Content
              side={ctx.side}
              sideOffset={contentProps.sideOffset ?? ctx.sideOffset}
              {...getStyles()}
            >
              {children}
              {showArrow && (
                <RadixTooltip.Arrow {...getStyles({ part: 'arrow' })} />
              )}
            </RadixTooltip.Content>
          </RadixTooltip.Portal>
        );
      },
    },
  },
} as Parameters<typeof defineCompound>[0]);
