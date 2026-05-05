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

export interface TooltipRootProps {
  variant?: Variant;
  side?: Side;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export interface TooltipProviderProps {
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
  children?: ReactNode;
}

export interface TooltipTriggerProps {
  asChild?: boolean;
  children?: ReactNode;
}

export interface TooltipContentProps {
  withArrow?: boolean;
  sideOffset?: number;
  children?: ReactNode;
}

interface TooltipCtxExtras {
  side: Side;
  sideOffset: number;
}

// Internal — the underlying defineCompound output. Cast at the bottom of
// this file to surface typed props on each consumer-facing part.
const _Tooltip = defineCompound({
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
});

/**
 * Consumer-facing type-surface cast.
 *
 * `defineCompound` today returns parts typed as `forwardRef<unknown, any>`
 * — which means consumers don't get autocomplete or type-checking on the
 * interfaces declared above. We cast at the recipe boundary so that
 * `<Tooltip variant="inverted">`, `<Tooltip.Provider delayDuration={500}>`,
 * `<Tooltip.Trigger asChild>`, and `<Tooltip.Content withArrow={false}>`
 * all flow through with full IDE support.
 *
 * This is a Wave 2 limitation in defineCompound's type machinery — see
 * spec OQ-9. The proper fix is to make defineCompound generic over per-part
 * prop types so consumers get this for free, without per-recipe casts.
 */
type TooltipPart<P> = (props: P) => React.ReactElement | null;

export const Tooltip = _Tooltip as unknown as TooltipPart<TooltipRootProps> & {
  displayName?: string;
  Provider: TooltipPart<TooltipProviderProps>;
  Trigger: TooltipPart<TooltipTriggerProps>;
  Content: TooltipPart<TooltipContentProps>;
  withDefaults: <P>(defaults: Partial<P>) => unknown;
};
