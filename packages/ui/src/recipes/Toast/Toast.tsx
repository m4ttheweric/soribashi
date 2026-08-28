import { Toast as BaseToast } from '@base-ui/react/toast';
import { autoVars, type PartRenderCtx, useTheme } from '@soribashi/core';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';
import { defineCompound } from '../../builders.ts';
import classes from './Toast.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 2 = transient overlay compound (§ 2.2). Toast is the package's first
 * manager-driven member: a global Provider plus an imperative queue on top of
 * the category-2 "Base UI owns lifecycle, recipe owns styling" split. Read by
 * packages/ui/scripts/derive.ts to build the agent-facing manifest; not itself
 * derived, since it records an authoring decision, not a fact recoverable from
 * RecipeMeta or the CSS.
 */
export const recipeCategory = 2 as const;

// Base UI part names/props read from the installed @base-ui/react@1.6.0 toast
// source: index.d.ts (`export * as Toast from index.parts`, so useToastManager /
// createToastManager live on the Toast namespace), provider/ToastProvider,
// viewport/ToastViewport, root/ToastRoot (required `toast`, optional
// swipeDirection), portal/ToastPortal, and {title,description,close,action}.

const TOAST_SLOT_KEYS = [
  'root',
  'viewport',
  'toast',
  'title',
  'description',
  'close',
  'action',
] as const;
type ToastSlotKey = (typeof TOAST_SLOT_KEYS)[number];

/**
 * Toast's own variant subset (authoring skill § 14): filled/light/outline.
 * ghost/link/subtle/default/transparent have no sane toast rendering, and
 * inheriting them would commit CSS, contrast cells, and baselines for pairings
 * no consumer wants.
 */
const TOAST_VARIANTS = ['filled', 'light', 'outline'] as const;

type Ctx<TProps> = PartRenderCtx<TProps, object, typeof TOAST_VARIANTS, ToastSlotKey>;

/** Options for the soribashi-branded imperative add(). intent maps to Base UI's `type`. */
export interface ToastAddOptions {
  title?: ReactNode;
  description?: ReactNode;
  /** A theme intent value; drives per-toast coloring via autoVars. */
  intent?: string;
  /** Props for the action button; forwarded to Base UI `actionProps`. */
  action?: ComponentPropsWithoutRef<'button'>;
  /** ms before auto-dismiss; 0 disables (Base UI). @default the provider timeout */
  timeout?: number;
  priority?: 'low' | 'high';
}

/**
 * Soribashi-native imperative toast API, wrapping Base UI's useToastManager.
 * `intent` maps to Base UI's per-toast `type` field; `action` to `actionProps`.
 */
export function useToast() {
  const manager = BaseToast.useToastManager();
  return {
    add: (o: ToastAddOptions) =>
      manager.add({
        title: o.title,
        description: o.description,
        type: o.intent,
        actionProps: o.action,
        timeout: o.timeout,
        priority: o.priority,
      }),
    close: manager.close,
    update: manager.update,
    promise: manager.promise,
    toasts: manager.toasts,
  };
}

/** Enqueue toasts from outside React (a store, an API layer). */
export const createToastManager = BaseToast.createToastManager;

type ProviderProps = BaseToast.Provider.Props;
type ViewportProps = Omit<BaseToast.Viewport.Props, 'render'> & {
  /** Re-anchor the portal inside a scoped wrapper (authoring skill § 15). */
  container?: BaseToast.Portal.Props['container'];
};

const ToastCompound = defineCompound({
  name: 'Toast',
  classes,
  slotKeys: TOAST_SLOT_KEYS,
  vocabularyAxes: ['intent', 'variant'] as const,
  variants: TOAST_VARIANTS,
  defaults: { variant: 'light' },
  parts: {
    // The compound root: Base UI's ToastProvider (a context node, no DOM box).
    // Making the Provider the root is what gives getStyles a non-null compound
    // context everywhere the consumer renders, including <Toast.Viewport/>: a
    // Viewport rendered outside any compound root would have rawCtx === null and
    // getStyles('viewport') would throw (verified in define-compound.tsx).
    root: {
      render: ({ props }: Ctx<ProviderProps>) => <BaseToast.Provider {...props} />,
    },
    // Batteries-included Viewport: soribashi owns the queue map. Base UI's own
    // ToastViewport renders only children + focus guards + a hidden live region
    // and does not self-portal, so this wraps Portal + Viewport and renders the
    // per-toast anatomy (toast/title/description/close/action are style slots,
    // NOT parts) via getStyles({ part }).
    viewport: {
      render: ({ props, getStyles, ctx }: Ctx<ViewportProps>) => {
        const { container, ...rest } = props;
        const theme = useTheme();
        const { toasts } = BaseToast.useToastManager();
        return (
          <BaseToast.Portal container={container}>
            <BaseToast.Viewport {...rest} {...getStyles({ part: 'viewport' })}>
              {toasts.map((t) => {
                // Per-toast intent coloring: intent is dynamic (t.type), so it
                // cannot ride the static vocabulary-axis path. Compute the same
                // --toast-bg/-color/-border autoVars derives for Alert, per
                // toast, from the intent resolver (invariant 2 - no hardcoded
                // colours). variant is the static default, from ctx.variant.
                // Only when the toast carries an intent: a toast added without
                // one keeps the neutral CSS fallback, and calling autoVars with
                // no intent both returns {} and warns in dev.
                const vars = (
                  t.type
                    ? (autoVars(theme, 'Toast', { intent: t.type, variant: ctx.variant }, true)
                        .root ?? {})
                    : {}
                ) as CSSProperties;
                const toastStyles = getStyles({ part: 'toast' });
                return (
                  <BaseToast.Root
                    key={t.id}
                    toast={t}
                    data-intent={t.type}
                    data-variant={ctx.variant}
                    {...toastStyles}
                    style={{ ...(toastStyles.style as CSSProperties | undefined), ...vars }}
                  >
                    <BaseToast.Title {...getStyles({ part: 'title' })} />
                    <BaseToast.Description {...getStyles({ part: 'description' })} />
                    {t.actionProps ? <BaseToast.Action {...getStyles({ part: 'action' })} /> : null}
                    <BaseToast.Close aria-label="Close" {...getStyles({ part: 'close' })}>
                      ×
                    </BaseToast.Close>
                  </BaseToast.Root>
                );
              })}
            </BaseToast.Viewport>
          </BaseToast.Portal>
        );
      },
    },
  },
});

/**
 * Public surface is Provider + Viewport only (spec AC1). `Toast.Provider` is the
 * compound root used bare (the "root part used bare" idiom Dialog documents);
 * `Toast.Viewport` is the auto-attached viewport part. The per-toast Base UI
 * anatomy is internal to the Viewport map, not a public member.
 */
export const Toast = Object.assign(ToastCompound, { Provider: ToastCompound });

export const toastTheme = Toast.extend({});
