'use client';
import { createEffect, createMemo, onCleanup, onMount, type JSX } from 'solid-js';
import { CompositeList } from '../../composite/list/CompositeList';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import {
  FloatingNode,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
} from '../../floating-ui-solid';
import { access, splitComponentProps } from '../../solid-helpers';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { inertValue } from '../../utils/inertValue';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { BaseUIComponentProps } from '../../utils/types';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { RenderElement } from '../../utils/useRenderElement';
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

  const positionMethodProp = () => access(local.positionMethod) ?? 'absolute';
  const collisionBoundary = () => access(local.collisionBoundary) ?? 'clipping-ancestors';
  const collisionPadding = () => access(local.collisionPadding) ?? 5;
  const arrowPadding = () => access(local.arrowPadding) ?? 5;
  const sticky = () => access(local.sticky) ?? false;
  const trackAnchor = () => access(local.trackAnchor) ?? true;
  const collisionAvoidance = () => access(local.collisionAvoidance) ?? DROPDOWN_COLLISION_AVOIDANCE;

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
    return parent.type === 'context-menu' ? (parent.context?.anchor ?? a) : a;
  };

  const computedAlign = () => {
    const a = access(local.align);
    if (parent.type === 'context-menu' || parent.type === 'menu' || parent.type === 'menubar') {
      return a ?? 'start';
    }
    return a;
  };

  const computedSide = () => {
    const s = access(local.side);
    if (parent.type === 'menu') {
      return s ?? 'inline-end';
    }
    if (parent.type === 'menubar') {
      return s ?? 'bottom';
    }
    return s;
  };

  const alignOffset = () => {
    const a = access(local.alignOffset);
    return parent.type === 'context-menu' ? (a ?? 2) : (a ?? 0);
  };

  const sideOffset = () => {
    const a = access(local.sideOffset);
    return parent.type === 'context-menu' ? (a ?? -5) : (a ?? 0);
  };

  const contextMenu = () => parent.type === 'context-menu';

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

  const positionerProps = createMemo<JSX.HTMLAttributes<HTMLDivElement>>(() => {
    const hiddenStyles: JSX.CSSProperties = {};

    if (!open()) {
      hiddenStyles['pointer-events'] = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted(),
      style: {
        ...positioner.positionerStyles(),
        ...hiddenStyles,
      },
    };
  });

  function onMenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
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
  }

  onMount(() => {
    menuEvents.on('openchange', onMenuOpenChange);
    onCleanup(() => {
      menuEvents.off('openchange', onMenuOpenChange);
    });
  });

  createEffect(() => {
    menuEvents.emit('openchange', { open: open(), nodeId: nodeId(), parentNodeId });
  });

  const state = createMemo<MenuPositioner.State>(() => ({
    open: open(),
    side: positioner.side(),
    align: positioner.align(),
    anchorHidden: positioner.anchorHidden(),
    nested: parent.type === 'menu',
  }));

  const contextValue: MenuPositionerContext = {
    side: positioner.side,
    align: positioner.align,
    refs: positioner.refs,
    arrowUncentered: positioner.arrowUncentered,
    arrowStyles: positioner.arrowStyles,
    floatingContext: positioner.context,
  };

  const shouldRenderBackdrop = () =>
    mounted() &&
    parent.type !== 'menu' &&
    ((parent.type !== 'menubar' && modal() && lastOpenChangeReason() !== 'trigger-hover') ||
      (parent.type === 'menubar' && parent.context.modal()));

  // cuts a hole in the backdrop to allow pointer interaction with the menubar or dropdown menu trigger element
  const backdropCutout = createMemo<HTMLElement | null | undefined>(() => {
    if (parent.type === 'menubar') {
      return parent.context.contentElement();
    }
    if (parent.type === undefined) {
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
            if (parent.type === 'context-menu' || parent.type === 'nested-context-menu') {
              parent.context.refs.internalBackdropRef = el;
            }
          }}
          inert={inertValue(!open())}
          cutout={backdropCutout()}
        />
      )}
      <FloatingNode id={nodeId()}>
        <CompositeList refs={{ elements: itemDomElements, labels: itemLabels }}>
          <RenderElement
            element="div"
            componentProps={componentProps}
            ref={(el) => {
              setPositionerElement(el);
              if (typeof componentProps.ref === 'function') {
                componentProps.ref(el);
              } else {
                componentProps.ref = el;
              }
            }}
            params={{
              state: state(),
              customStyleHookMapping: popupStateMapping,
              props: [positionerProps(), elementProps],
            }}
          />
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

  export interface Props
    extends useAnchorPositioning.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
