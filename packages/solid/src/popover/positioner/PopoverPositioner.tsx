'use client';
import { createMemo, Show, type JSX } from 'solid-js';
import { FloatingNode, useFloatingNodeId } from '../../floating-ui-solid';
import { access, splitComponentProps } from '../../solid-helpers';
import { POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';
import { inertValue } from '../../utils/inertValue';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { usePopoverPortalContext } from '../portal/PopoverPortalContext';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPositionerContext } from './PopoverPositionerContext';

/**
 * Positions the popover against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverPositioner(componentProps: PopoverPositioner.Props) {
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
  const anchor = () => access(local.anchor);
  const positionMethod = () => access(local.positionMethod) ?? 'absolute';
  const side = () => access(local.side) ?? 'bottom';
  const align = () => access(local.align) ?? 'center';
  const sideOffset = () => access(local.sideOffset) ?? 0;
  const alignOffset = () => access(local.alignOffset) ?? 0;
  const collisionBoundary = () => access(local.collisionBoundary) ?? 'clipping-ancestors';
  const collisionPadding = () => access(local.collisionPadding) ?? 5;
  const arrowPadding = () => access(local.arrowPadding) ?? 5;
  const sticky = () => access(local.sticky) ?? false;
  const trackAnchor = () => access(local.trackAnchor) ?? true;
  const collisionAvoidance = () => access(local.collisionAvoidance) ?? POPUP_COLLISION_AVOIDANCE;

  const {
    floatingRootContext,
    open,
    mounted,
    setPositionerElement,
    modal,
    openReason,
    openMethod,
    triggerElement,
  } = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();
  const nodeId = useFloatingNodeId();

  const positioning = useAnchorPositioning({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    trackAnchor,
    keepMounted,
    nodeId,
    collisionAvoidance,
  });

  const defaultProps = createMemo<HTMLProps>(() => {
    const hiddenStyles: JSX.CSSProperties = {};

    if (!open()) {
      hiddenStyles['pointer-events'] = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted(),
      style: {
        ...positioning.positionerStyles(),
        ...hiddenStyles,
      },
    };
  });

  const positioner: PopoverPositionerContext = {
    props: defaultProps,
    ...positioning,
  };

  const state: PopoverPositioner.State = {
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
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setPositionerElement,
    props: [positioner.props, elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <PopoverPositionerContext.Provider value={positioner}>
      <Show
        when={
          mounted() &&
          modal() === true &&
          openReason() !== 'trigger-hover' &&
          openMethod() !== 'touch'
        }
      >
        <InternalBackdrop managed inert={inertValue(!open())} cutout={triggerElement()} />
      </Show>

      <FloatingNode id={nodeId()}>{element()}</FloatingNode>
    </PopoverPositionerContext.Provider>
  );
}

export namespace PopoverPositioner {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends useAnchorPositioning.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
