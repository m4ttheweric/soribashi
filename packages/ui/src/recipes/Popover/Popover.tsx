import { Popover as BasePopover } from '@base-ui/react/popover';
import { defineCompound, type PartRenderCtx } from '@soribashi/core';
import type { ReactNode, Ref } from 'react';
import classes from './Popover.module.css';

/**
 * The full declared slot set (spec: root, trigger, positioner, popup, arrow,
 * title, description, close). `root`, `trigger`, and `positioner` have no
 * rules in Popover.module.css today (Base UI owns their box model/position),
 * but getStyles() still wires them so a future `popoverTheme.extend({
 * classNames })` can target them.
 */
type PopoverSlotKey =
  | 'root'
  | 'trigger'
  | 'positioner'
  | 'popup'
  | 'arrow'
  | 'title'
  | 'description'
  | 'close';

type Ctx<TProps> = PartRenderCtx<TProps, object, readonly [], PopoverSlotKey>;

type RootProps = BasePopover.Root.Props;
type TriggerProps = BasePopover.Trigger.Props;

/**
 * Content composes Portal + Positioner + Popup + Arrow into a single public
 * part. `container` forwards to the Portal — load-bearing for Tasks 10/11:
 * a default-portalled popup renders under `<body>`, escaping any `.tenant-*`
 * or `.dark` scoped-theme wrapper, so a consumer must be able to re-anchor
 * the portal inside that scope via this prop. Everything else in `rest`
 * forwards to the Positioner (side/align/sideOffset/...); `children` render
 * inside the Popup.
 */
type ContentProps = Omit<BasePopover.Positioner.Props, 'children'> & {
  container?: BasePopover.Portal.Props['container'];
  children?: ReactNode;
};

type TitleProps = BasePopover.Title.Props;
type DescriptionProps = BasePopover.Description.Props;
type CloseProps = BasePopover.Close.Props;

const PopoverCompound = defineCompound({
  name: 'Popover',
  classes,
  parts: {
    root: {
      // No DOM of its own: Base UI's Root is a context provider, so there is
      // no element to attach getStyles('root') or a ref to.
      render: ({ props }: Ctx<RootProps>) => <BasePopover.Root {...props} />,
    },
    trigger: {
      render: ({ props, getStyles, ref }: Ctx<TriggerProps>) => {
        // classNames/styles/vars/attributes/unstyled are the Styles API's own
        // config surface (consumed internally via getStyles, not valid DOM/Base
        // UI props); stripped the same way Button.tsx strips them before spread.
        const {
          classNames: _classNames,
          styles: _styles,
          vars: _vars,
          attributes: _attributes,
          unstyled: _unstyled,
          ...rest
        } = props;
        // PartRenderCtx.ref is fixed as Ref<unknown> (not parametrized per
        // part element type — see define-compound.tsx's PartRenderCtx), so a
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
          classNames: _classNames,
          styles: _styles,
          vars: _vars,
          attributes: _attributes,
          unstyled: _unstyled,
          ...rest
        } = props;
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
        const {
          classNames: _classNames,
          styles: _styles,
          vars: _vars,
          attributes: _attributes,
          unstyled: _unstyled,
          ...rest
        } = props;
        return (
          <BasePopover.Title ref={ref as Ref<HTMLHeadingElement>} {...rest} {...getStyles()} />
        );
      },
    },
    description: {
      render: ({ props, getStyles, ref }: Ctx<DescriptionProps>) => {
        const {
          classNames: _classNames,
          styles: _styles,
          vars: _vars,
          attributes: _attributes,
          unstyled: _unstyled,
          ...rest
        } = props;
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
        const {
          classNames: _classNames,
          styles: _styles,
          vars: _vars,
          attributes: _attributes,
          unstyled: _unstyled,
          ...rest
        } = props;
        return <BasePopover.Close ref={ref as Ref<HTMLButtonElement>} {...rest} {...getStyles()} />;
      },
    },
  },
});

/**
 * defineCompound's root part is designed to be used bare (`<PopoverCompound>`
 * — see define-compound.test.tsx's Cycle 7.1; `parts.root` is deliberately
 * excluded from the dotted namespace, only `Trigger`/`Content`/`Title`/
 * `Description`/`Close` are attached). This recipe's call sites are meant to
 * read `Popover.Root`, `Popover.Trigger`, ... uniformly, so `Root` is
 * aliased here to the same component rather than exposed bare — a
 * recipe-level ergonomics choice layered on top of the framework mechanics,
 * not a framework change.
 */
export const Popover = Object.assign(PopoverCompound, { Root: PopoverCompound });

export const popoverTheme = Popover.extend({});
