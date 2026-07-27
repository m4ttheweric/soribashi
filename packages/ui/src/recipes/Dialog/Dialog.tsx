import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { PartRenderCtx } from '@soribashi/core';
import type { ReactNode, Ref } from 'react';
import { defineCompound } from '../../builders.ts';
import classes from './Dialog.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 2 = transient overlay compound (§ 2.2, Wave 2's Tooltip pattern: Base UI
 * owns open/close lifecycle, the recipe owns styling + slot wiring). Dialog
 * is the package's first MODAL member of this category (Popover/Tooltip are
 * both non-modal); the category still applies because Base UI still owns the
 * whole open/close/focus lifecycle here too, modality included. Read by
 * packages/ui/scripts/derive.ts to build the agent-facing manifest; not
 * itself derived, since it records an authoring decision, not a fact
 * recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 2 as const;

/**
 * The full declared slot set. Declared as a const array rather than a bare
 * type union so `defineCompound` can report it as RecipeMeta.slots: the
 * union alone is compile-time only, and neither the parts map nor the CSS
 * module can reconstruct it (`backdrop` is neither a public part nor part of
 * `content`'s own type, and `content` is a part but not a style slot -- the
 * identical root/positioner asymmetry Popover.tsx's own doc comment
 * describes, here between `content` and `backdrop`/`popup`). `root` and
 * `trigger` have no rules in Dialog.module.css today (Base UI owns their box
 * model) but getStyles() still wires them so a future
 * `dialogTheme.extend({ classNames })` can target them.
 */
const DIALOG_SLOT_KEYS = [
  'root',
  'trigger',
  'backdrop',
  'popup',
  'title',
  'description',
  'close',
] as const;

type DialogSlotKey = (typeof DIALOG_SLOT_KEYS)[number];

type Ctx<TProps> = PartRenderCtx<TProps, object, readonly [], DialogSlotKey>;

/**
 * `modal` (`true` | `false` | `'trap-focus'`, default `true`) and
 * `defaultOpen`/`open`/`onOpenChange` all live on `BaseDialog.Root.Props`
 * and are forwarded straight through by the root part below (no recipe-side
 * handling, same shape as Popover.tsx's `RootProps`): confirmed against the
 * installed `packages/ui/node_modules/@base-ui/react/dialog/root/DialogRoot.d.ts`.
 * Focus containment and return are Base UI's own responsibility, NOT this
 * recipe's: `DialogPopup.js` wraps its rendered element in Floating UI
 * React's `FloatingFocusManager` with `modal={modal !== false}`,
 * `restoreFocus="popup"`, and `initialFocus`/`finalFocus` read straight off
 * `Dialog.Content`'s own props (this recipe's `ContentProps`, below) --
 * there is no separate trap/return mechanism to author here.
 */
type RootProps = BaseDialog.Root.Props;

// `render` is Base UI's own polymorphism mechanism (see Popover.tsx's
// identical note): every part-prop alias below omits it so it is a type
// error at the call site, not just stripped at runtime.
type TriggerProps = Omit<BaseDialog.Trigger.Props, 'render'>;

/**
 * Content composes Portal + Backdrop + Popup into a single public part, the
 * same "compose the floating pieces behind one part" shape Popover.tsx's/
 * Tooltip.tsx's own `ContentProps` use -- but with NO Positioner in between:
 * confirmed against the installed `dialog/index.parts.d.ts`, Base UI's
 * Dialog has no Positioner part at all (a modal dialog has no anchor side to
 * float against; the popup centres on the viewport via this recipe's own
 * CSS instead, Dialog.module.css's `.popup` rule). `container` forwards to
 * the Portal for the same portal-escapes-scope reason Popover's/Tooltip's
 * own `container` does (a default-portalled popup renders under `<body>`,
 * escaping any `.tenant-*`/`.dark` scoped-theme wrapper). The rest of
 * `ContentProps` is `BaseDialog.Popup.Props` (not Positioner's, since there
 * is none) -- `initialFocus`/`finalFocus` included, so a caller can still
 * override Base UI's own sensible defaults (first tabbable / trigger)
 * through this one part, matching where Base UI itself puts those props.
 *
 * `className`/`style` are omitted here (fix-wave Important 1), not just
 * dropped at runtime, for the identical structural reason Popover.tsx's/
 * Tooltip.tsx's own `ContentProps` give: `Content` composes multiple DOM
 * elements (Portal + Backdrop + Popup) with no single natural target for a
 * bare `className`/`style` (use `classNames={{ popup: '...' }}` instead).
 * Before this fix, both keys type-accepted here while the render body below
 * silently discarded them (still destructured there as a harmless
 * double-guard, now unreachable via the public type).
 */
type ContentProps = Omit<BaseDialog.Popup.Props, 'children' | 'render' | 'className' | 'style'> & {
  container?: BaseDialog.Portal.Props['container'];
  children?: ReactNode;
};

type TitleProps = Omit<BaseDialog.Title.Props, 'render'>;
type DescriptionProps = Omit<BaseDialog.Description.Props, 'render'>;
type CloseProps = Omit<BaseDialog.Close.Props, 'render'>;

/**
 * Strips the Styles API's own framework keys (consumed internally via
 * getStyles, not valid DOM/Base UI props) plus Base UI's `render` prop
 * (soribashi's compound parts do not expose it publicly). Duplicated
 * verbatim from Popover.tsx/Tooltip.tsx rather than shared, per
 * generate-registry.ts's per-recipe vendoring (each recipe module must stand
 * alone; a consumer installs one recipe's files with no cross-recipe
 * import).
 */
function stripFrameworkKeys<
  T extends Partial<
    Record<'classNames' | 'styles' | 'vars' | 'attributes' | 'unstyled' | 'render', unknown>
  >,
>(props: T): Omit<T, 'classNames' | 'styles' | 'vars' | 'attributes' | 'unstyled' | 'render'> {
  const {
    classNames: _classNames,
    styles: _styles,
    vars: _vars,
    attributes: _attributes,
    unstyled: _unstyled,
    render: _render,
    ...rest
  } = props;
  return rest;
}

const DialogCompound = defineCompound({
  name: 'Dialog',
  classes,
  slotKeys: DIALOG_SLOT_KEYS,
  parts: {
    root: {
      // No DOM of its own: Base UI's Root is a context provider, so there is
      // no element to attach getStyles('root') or a ref to. Same shape as
      // Popover.tsx's/Tooltip.tsx's own root part.
      render: ({ props }: Ctx<RootProps>) => <BaseDialog.Root {...props} />,
    },
    trigger: {
      render: ({ props, getStyles, ref }: Ctx<TriggerProps>) => {
        const rest = stripFrameworkKeys(props);
        // PartRenderCtx.ref is fixed as Ref<unknown> (not parametrized per
        // part element type, see define-compound.tsx's PartRenderCtx), so a
        // narrowing cast is required at each concrete Base UI element; the
        // runtime ref object/callback passes through defineCompound's
        // forwardRef wiring unchanged, only the static type is widened.
        return (
          <BaseDialog.Trigger ref={ref as Ref<HTMLButtonElement>} {...rest} {...getStyles()} />
        );
      },
    },
    content: {
      render: ({ props, getStyles, ref }: Ctx<ContentProps>) => {
        const {
          children,
          container,
          className: _className,
          style: _style,
          ...withoutOwnProps
        } = props;
        const rest = stripFrameworkKeys(withoutOwnProps);
        return (
          <BaseDialog.Portal container={container}>
            <BaseDialog.Backdrop {...getStyles({ part: 'backdrop' })} />
            <BaseDialog.Popup
              ref={ref as Ref<HTMLDivElement>}
              {...rest}
              {...getStyles({ part: 'popup' })}
            >
              {children}
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        );
      },
    },
    title: {
      render: ({ props, getStyles, ref }: Ctx<TitleProps>) => {
        const rest = stripFrameworkKeys(props);
        return <BaseDialog.Title ref={ref as Ref<HTMLHeadingElement>} {...rest} {...getStyles()} />;
      },
    },
    description: {
      render: ({ props, getStyles, ref }: Ctx<DescriptionProps>) => {
        const rest = stripFrameworkKeys(props);
        return (
          <BaseDialog.Description
            ref={ref as Ref<HTMLParagraphElement>}
            {...rest}
            {...getStyles()}
          />
        );
      },
    },
    close: {
      render: ({ props, getStyles, ref }: Ctx<CloseProps>) => {
        const rest = stripFrameworkKeys(props);
        return <BaseDialog.Close ref={ref as Ref<HTMLButtonElement>} {...rest} {...getStyles()} />;
      },
    },
  },
});

/**
 * defineCompound's root part is designed to be used bare (`<DialogCompound>`,
 * see define-compound.test.tsx's Cycle 7.1; identical to Popover.tsx's/
 * Tooltip.tsx's own alias). This recipe's call sites are meant to read
 * `Dialog.Root`, `Dialog.Trigger`, ... uniformly, so `Root` is aliased here
 * to the same component rather than exposed bare.
 */
export const Dialog = Object.assign(DialogCompound, { Root: DialogCompound });

export const dialogTheme = Dialog.extend({});
