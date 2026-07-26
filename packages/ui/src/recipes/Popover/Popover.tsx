import { Popover as BasePopover } from '@base-ui/react/popover';
import { defineCompound, type PartRenderCtx } from '@soribashi/core';
import type { ReactNode, Ref } from 'react';
import classes from './Popover.module.css';

/**
 * Authoring category from the recipe conversion playbook's four categories
 * (docs/superpowers/specs/2026-04-26-recipe-conversion-playbook.md § 2):
 * 2 = transient overlay compound (§ 2.2, Wave 2's Tooltip pattern: Base UI
 * owns open/close lifecycle, the recipe owns styling + slot wiring). Read by
 * packages/ui/scripts/derive.ts to build the agent-facing manifest; not
 * itself derived, since it records an authoring decision, not a fact
 * recoverable from RecipeMeta or the CSS.
 */
export const recipeCategory = 2 as const;

/**
 * The full declared slot set. Declared as a const array rather than a bare
 * type union so `defineCompound` can report it as RecipeMeta.slots: the
 * union alone is compile-time only, and neither the parts map nor the CSS
 * module can reconstruct it (`positioner` is neither a part nor a styled
 * class, and `content` is a part but not a style slot). `root`, `trigger`,
 * and `positioner` have no rules in Popover.module.css today (Base UI owns
 * their box model and position) but getStyles() still wires them so a future
 * `popoverTheme.extend({ classNames })` can target them.
 */
const POPOVER_SLOT_KEYS = [
  'root',
  'trigger',
  'positioner',
  'popup',
  'arrow',
  'title',
  'description',
  'close',
] as const;

type PopoverSlotKey = (typeof POPOVER_SLOT_KEYS)[number];

type Ctx<TProps> = PartRenderCtx<TProps, object, readonly [], PopoverSlotKey>;

type RootProps = BasePopover.Root.Props;

// `render` is Base UI's own polymorphism mechanism (see the `as` question
// note below the compound definition): every part-prop alias below omits it
// so it is a type error at the call site, not just stripped at runtime.
type TriggerProps = Omit<BasePopover.Trigger.Props, 'render'>;

/**
 * Content composes Portal + Positioner + Popup + Arrow into a single public
 * part. `container` forwards to the Portal: load-bearing for Tasks 10/11,
 * since a default-portalled popup renders under `<body>`, escaping any
 * `.tenant-*` or `.dark` scoped-theme wrapper, so a consumer must be able to
 * re-anchor the portal inside that scope via this prop. Everything else in
 * `rest` forwards to the Positioner (side/align/sideOffset/...); `children`
 * render inside the Popup.
 */
type ContentProps = Omit<BasePopover.Positioner.Props, 'children' | 'render'> & {
  container?: BasePopover.Portal.Props['container'];
  children?: ReactNode;
};

type TitleProps = Omit<BasePopover.Title.Props, 'render'>;
type DescriptionProps = Omit<BasePopover.Description.Props, 'render'>;
type CloseProps = Omit<BasePopover.Close.Props, 'render'>;

/**
 * Strips the Styles API's own framework keys (consumed internally via
 * getStyles, not valid DOM/Base UI props) plus Base UI's `render` prop
 * (soribashi's compound parts do not expose it publicly). Shared by every
 * leaf part below so a future part cannot silently drop one of these the
 * way `render` was originally dropped from this stripping list.
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

const PopoverCompound = defineCompound({
  name: 'Popover',
  classes,
  slotKeys: POPOVER_SLOT_KEYS,
  parts: {
    root: {
      // No DOM of its own: Base UI's Root is a context provider, so there is
      // no element to attach getStyles('root') or a ref to.
      render: ({ props }: Ctx<RootProps>) => <BasePopover.Root {...props} />,
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
          <BasePopover.Trigger ref={ref as Ref<HTMLButtonElement>} {...rest} {...getStyles()} />
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
          <BasePopover.Portal container={container}>
            <BasePopover.Positioner sideOffset={8} {...rest} {...getStyles({ part: 'positioner' })}>
              <BasePopover.Popup ref={ref as Ref<HTMLDivElement>} {...getStyles({ part: 'popup' })}>
                <BasePopover.Arrow {...getStyles({ part: 'arrow' })} />
                {children}
              </BasePopover.Popup>
            </BasePopover.Positioner>
          </BasePopover.Portal>
        );
      },
    },
    title: {
      render: ({ props, getStyles, ref }: Ctx<TitleProps>) => {
        const rest = stripFrameworkKeys(props);
        return (
          <BasePopover.Title ref={ref as Ref<HTMLHeadingElement>} {...rest} {...getStyles()} />
        );
      },
    },
    description: {
      render: ({ props, getStyles, ref }: Ctx<DescriptionProps>) => {
        const rest = stripFrameworkKeys(props);
        return (
          <BasePopover.Description
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
        return <BasePopover.Close ref={ref as Ref<HTMLButtonElement>} {...rest} {...getStyles()} />;
      },
    },
  },
});

/**
 * defineCompound's root part is designed to be used bare (`<PopoverCompound>`,
 * see define-compound.test.tsx's Cycle 7.1; `parts.root` is deliberately
 * excluded from the dotted namespace, only `Trigger`/`Content`/`Title`/
 * `Description`/`Close` are attached). This recipe's call sites are meant to
 * read `Popover.Root`, `Popover.Trigger`, ... uniformly, so `Root` is
 * aliased here to the same component rather than exposed bare: a
 * recipe-level ergonomics choice layered on top of the framework mechanics,
 * not a framework change.
 */
export const Popover = Object.assign(PopoverCompound, { Root: PopoverCompound });

export const popoverTheme = Popover.extend({});
