import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { defineCompound } from '../../builders.ts';

/**
 * Tooltip recipe -- Category 2 overlay compound template.
 *
 * Adapts the proven Radix compound pattern from apps/pilot/src/recipes/Tooltip
 * (CSS modules) to the three-band Tailwind v4 utility model. This is the
 * FIRST compound in shadcn-starter and the template Dialog and DropdownMenu
 * follow: no vocabulary axes, no variants, pure structural compound.
 *
 * Parts:
 *   - root: renders RadixTooltip.Provider wrapping RadixTooltip.Root. A
 *     single part owns both so consumers never need a separate Provider tag.
 *   - trigger: asChild-wraps the consumer's child in a span so Radix's
 *     hover/focus state machine attaches to it and the compound's styles-API
 *     output (classes/vars/attributes) lands on that same node.
 *   - content: renders inside RadixTooltip.Portal; side/sideOffset default
 *     from ctx (set by `context`) but consumer props override.
 *   - arrow: not a consumer-facing part, but a style-addressable slot (via
 *     getStyles({ part: 'arrow' })) that Content renders as RadixTooltip.Arrow.
 */

const classes = {
  root: '',
  trigger: '',
  content: [
    // band 1: structural
    'z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance',
    'animate-in fade-in-0 zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    // band 2: var-indirection
    'bg-(--color-primary-900) text-(--color-primary-foreground)',
  ].join(' '),
  arrow: 'fill-(--color-primary-900)',
};

export interface TooltipRootProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

export interface TooltipTriggerProps {
  children?: ReactNode;
}

export interface TooltipContentProps {
  children?: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

export const Tooltip = defineCompound({
  name: 'Tooltip',
  classes,
  context: (_rootProps: TooltipRootProps) => ({
    side: 'top' as const,
    sideOffset: 4,
  }),
  parts: {
    // Root -- class-2 part. Owns both RadixTooltip.Provider (delay-duration
    // state machine) and RadixTooltip.Root (open/close state) so the public
    // API is just <Tooltip>...</Tooltip>; no separate Provider tag required.
    root: {
      render: ({ props, children }: any) => {
        const {
          open,
          defaultOpen,
          onOpenChange,
          delayDuration,
          className,
          style,
          classNames,
          styles,
          unstyled,
          attributes,
          vars,
          ...rest
        } = props;
        return (
          <RadixTooltip.Provider delayDuration={delayDuration ?? 200}>
            <RadixTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
              {children}
            </RadixTooltip.Root>
          </RadixTooltip.Provider>
        );
      },
    },
    // Trigger -- asChild wraps the consumer's child in a span so Radix's
    // state machine (hover/focus handlers, aria-describedby) attaches to a
    // node that also carries the compound's own styles-API output.
    trigger: {
      render: ({ props, getStyles, children, ref }: any) => {
        const { className, style, classNames, styles, unstyled, attributes, vars, ...rest } = props;
        return (
          <RadixTooltip.Trigger asChild>
            <span ref={ref} {...rest} {...getStyles()}>
              {children}
            </span>
          </RadixTooltip.Trigger>
        );
      },
    },
    // Content -- class-2 part. Renders inside a Portal; reads side/sideOffset
    // defaults from ctx unless the consumer overrides them. Renders the arrow
    // as a cross-slot style target (getStyles({ part: 'arrow' })).
    content: {
      render: ({ props, getStyles, children, ctx, ref }: any) => {
        const {
          side,
          sideOffset,
          className,
          style,
          classNames,
          styles,
          unstyled,
          attributes,
          vars,
          ...rest
        } = props;
        return (
          <RadixTooltip.Portal>
            <RadixTooltip.Content
              ref={ref}
              side={side ?? ctx.side}
              sideOffset={sideOffset ?? ctx.sideOffset}
              {...rest}
              {...getStyles()}
            >
              {children}
              <RadixTooltip.Arrow {...getStyles({ part: 'arrow' })} />
            </RadixTooltip.Content>
          </RadixTooltip.Portal>
        );
      },
    },
  },
});

export const tooltipTheme = Tooltip.extend({});
