'use client';
import { batch, createEffect, createMemo, onCleanup, onMount, type JSX } from 'solid-js';
import { CompositeList } from '../../composite/list/CompositeList';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import {
  FloatingNode,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
  type Padding,
  type VirtualElement,
} from '../../floating-ui-solid';
import { access, splitComponentProps } from '../../solid-helpers';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { inertValue } from '../../utils/inertValue';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { BaseUIComponentProps } from '../../utils/types';
import {
  useAnchorPositioning,
  type Align,
  type Boundary,
  type CollisionAvoidance,
  type OffsetFunction,
  type Side,
} from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElement';
import { useMenuPortalContext } from '../portal/MenuPortalContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuPositionerContext } from './MenuPositionerContext';

/**
 * Positions the menu popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuPositioner(componentProps: MenuPositioner.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'anchor',
    'positionMethod',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'collisionBoundary',
    'collisionPadding',
    'arrowPadding',
    'sticky',
    'trackAnchor',
    'collisionAvoidance',
  ]);

  const positionMethodProp = () => local.positionMethod ?? 'absolute';
  const collisionBoundary = () => local.collisionBoundary ?? 'clipping-ancestors';
  const collisionPadding = () => local.collisionPadding ?? 5;
  const arrowPadding = () => local.arrowPadding ?? 5;
  const sticky = () => local.sticky ?? false;
  const trackAnchor = () => local.trackAnchor ?? true;
  const collisionAvoidance = () => local.collisionAvoidance ?? DROPDOWN_COLLISION_AVOIDANCE;

  const {
    open,
    setOpen,
    floatingRootContext,
    itemDomElements,
    itemLabels,
    mounted,
    modal,
    lastOpenChangeReason,
    parent,
    setHoverEnabled,
    triggerElement,
    setPositionerElement,
  } = useMenuRootContext();

  const keepMounted = useMenuPortalContext();
  const nodeId = useFloatingNodeId();
  const parentNodeId = useFloatingParentNodeId();
  const contextMenuContext = useContextMenuRootContext(true);

  const anchor = () => {
    const a = access(local.anchor);
    const p = parent();
    return p.type === 'context-menu' ? (p.context?.anchor ?? a) : a;
  };

  const computedAlign = () => {
    const a = access(local.align);
    const p = parent();
    if (p.type === 'context-menu' || p.type === 'menu' || p.type === 'menubar') {
      return a ?? 'start';
    }
    return a;
  };

  const computedSide = () => {
    const s = access(local.side);
    const p = parent();
    if (p.type === 'menu') {
      return s ?? 'inline-end';
    }
    if (p.type === 'menubar') {
      return s ?? 'bottom';
    }
    return s;
  };

  const alignOffset = () => {
    return parent().type === 'context-menu' ? (local.alignOffset ?? 2) : (local.alignOffset ?? 0);
  };

  const sideOffset = () => {
    return parent().type === 'context-menu' ? (local.sideOffset ?? -5) : (local.sideOffset ?? 0);
  };

  const contextMenu = () => parent().type === 'context-menu';

  const positioner = useAnchorPositioning({
    anchor,
    floatingRootContext,
    positionMethod: () => (contextMenuContext ? 'fixed' : positionMethodProp()),
    mounted,
    side: computedSide,
    sideOffset,
    align: computedAlign,
    alignOffset,
    arrowPadding: () => (contextMenu() ? 0 : arrowPadding()),
    collisionBoundary,
    collisionPadding,
    sticky,
    nodeId,
    keepMounted,
    trackAnchor,
    collisionAvoidance,
    shiftCrossAxis: contextMenu,
  });

  const { events: menuEvents } = useFloatingTree()!;

  const positionerProps: JSX.HTMLAttributes<HTMLDivElement> = {
    role: 'presentation',
    get hidden() {
      return !mounted();
    },
    get style() {
      const hiddenStyles: JSX.CSSProperties = {};

      if (!open()) {
        hiddenStyles['pointer-events'] = 'none';
      }

      return {
        ...positioner.positionerStyles(),
        ...hiddenStyles,
      };
    },
  };

  function onMenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
    batch(() => {
      if (event.open) {
        if (event.parentNodeId === nodeId()) {
          setHoverEnabled(false);
        }
        if (event.nodeId !== nodeId() && event.parentNodeId === parentNodeId) {
          setOpen(false, undefined, 'sibling-open');
        }
      } else if (event.parentNodeId === nodeId()) {
        setHoverEnabled(true);
      }
    });
  }

  onMount(() => {
    menuEvents.on('openchange', onMenuOpenChange);
    onCleanup(() => {
      menuEvents.off('openchange', onMenuOpenChange);
    });
  });

  createEffect(() => {
    // queueMicrotask(() => {
    menuEvents.emit('openchange', { open: open(), nodeId: nodeId(), parentNodeId });
    // });
  });

  const state: MenuPositioner.State = {
    get open() {
      return open();
    },
    get side() {
      return positioner.side();
    },
    get align() {
      return positioner.align();
    },
    get anchorHidden() {
      return positioner.anchorHidden();
    },
    get nested() {
      return parent().type === 'menu';
    },
  };

  const contextValue: MenuPositionerContext = {
    side: positioner.side,
    align: positioner.align,
    refs: positioner.refs,
    arrowUncentered: positioner.arrowUncentered,
    arrowStyles: positioner.arrowStyles,
    get floatingContext() {
      return access(positioner.context);
    },
  };

  onCleanup(() => {
    setPositionerElement(null);
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setPositionerElement,
    customStyleHookMapping: popupStateMapping,
    props: [positionerProps, elementProps],
  });

  const shouldRenderBackdrop = () => {
    const p = parent();
    return (
      mounted() &&
      p.type !== 'menu' &&
      ((p.type !== 'menubar' && modal() && lastOpenChangeReason() !== 'trigger-hover') ||
        (p.type === 'menubar' && p.context.modal()))
    );
  };

  // cuts a hole in the backdrop to allow pointer interaction with the menubar or dropdown menu trigger element
  const backdropCutout = createMemo<HTMLElement | null | undefined>(() => {
    const p = parent();
    if (p.type === 'menubar') {
      return p.context.contentElement();
    }
    if (p.type === undefined) {
      return triggerElement();
    }
    return null;
  });

  return (
    <MenuPositionerContext.Provider value={contextValue}>
      {shouldRenderBackdrop() && (
        <InternalBackdrop
          managed
          ref={(el) => {
            const p = parent();
            if (p.type === 'context-menu' || p.type === 'nested-context-menu') {
              p.context.refs.internalBackdropRef = el;
            }
          }}
          inert={inertValue(!open())}
          cutout={backdropCutout()}
        />
      )}
      <FloatingNode id={nodeId()}>
        <CompositeList refs={{ elements: itemDomElements, labels: itemLabels }}>
          {element()}
        </CompositeList>
      </FloatingNode>
    </MenuPositionerContext.Provider>
  );
}

export namespace MenuPositioner {
  export interface State {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
    nested: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * An element to position the popup against.
     * By default, the popup will be positioned against the trigger.
     */
    anchor?: Element | null | VirtualElement | (() => Element | VirtualElement | null) | undefined;
    /**
     * Determines which CSS `position` property to use.
     * @default 'absolute'
     */
    positionMethod?: 'absolute' | 'fixed';
    /**
     * Which side of the anchor element to align the popup against.
     * May automatically change to avoid collisions.
     * @default 'bottom'
     */
    side?: Side;
    /**
     * Distance between the anchor and the popup in pixels.
     * Also accepts a function that returns the distance to read the dimensions of the anchor
     * and positioner elements, along with its side and alignment.
     *
     * - `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
     * - `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
     * - `data.side`: which side of the anchor element the positioner is aligned against.
     * - `data.align`: how the positioner is aligned relative to the specified side.
     * @default 0
     */
    sideOffset?: number | OffsetFunction;
    /**
     * How to align the popup relative to the specified side.
     * @default 'center'
     */
    align?: 'start' | 'end' | 'center';
    /**
     * Additional offset along the alignment axis in pixels.
     * Also accepts a function that returns the offset to read the dimensions of the anchor
     * and positioner elements, along with its side and alignment.
     *
     * - `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
     * - `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
     * - `data.side`: which side of the anchor element the positioner is aligned against.
     * - `data.align`: how the positioner is aligned relative to the specified side.
     * @default 0
     */
    alignOffset?: number | OffsetFunction;
    /**
     * An element or a rectangle that delimits the area that the popup is confined to.
     * @default 'clipping-ancestors'
     */
    collisionBoundary?: Boundary;
    /**
     * Additional space to maintain from the edge of the collision boundary.
     * @default 5
     */
    collisionPadding?: Padding;
    /**
     * Whether to maintain the popup in the viewport after
     * the anchor element was scrolled out of view.
     * @default false
     */
    sticky?: boolean;
    /**
     * Minimum distance to maintain between the arrow and the edges of the popup.
     *
     * Use it to prevent the arrow element from hanging out of the rounded corners of a popup.
     * @default 5
     */
    arrowPadding?: number;
    /**
     * Whether the popup tracks any layout shift of its positioning anchor.
     * @default true
     */
    trackAnchor?: boolean;
    /**
     * Determines how to handle collisions when positioning the popup.
     */
    collisionAvoidance?: CollisionAvoidance;
  }
}
