'use client';
import { createMemo, type JSX } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTooltipPortalContext } from '../portal/TooltipPortalContext';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { TooltipPositionerContext } from './TooltipPositionerContext';

/**
 * Positions the tooltip against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipPositioner(componentProps: TooltipPositioner.Props) {
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
  const side = () => access(local.side) ?? 'top';
  const align = () => access(local.align) ?? 'center';
  const sideOffset = () => access(local.sideOffset) ?? 0;
  const alignOffset = () => access(local.alignOffset) ?? 0;
  const collisionBoundary = () => access(local.collisionBoundary) ?? 'clipping-ancestors';
  const collisionPadding = () => access(local.collisionPadding) ?? 5;
  const arrowPadding = () => access(local.arrowPadding) ?? 5;
  const sticky = () => access(local.sticky) ?? false;
  const trackAnchor = () => access(local.trackAnchor) ?? true;
  const collisionAvoidance = () => access(local.collisionAvoidance) ?? POPUP_COLLISION_AVOIDANCE;

  const { open, setPositionerElement, mounted, floatingRootContext, trackCursorAxis, hoverable } =
    useTooltipRootContext();
  const keepMounted = useTooltipPortalContext();

  const positioning = useAnchorPositioning({
    anchor,
    positionMethod,
    floatingRootContext,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    collisionBoundary,
    collisionPadding,
    sticky,
    arrowPadding,
    trackAnchor,
    keepMounted,
    collisionAvoidance,
  });

  const defaultProps = createMemo<HTMLProps>(() => {
    const hiddenStyles: JSX.CSSProperties = {};

    if (!open() || trackCursorAxis() === 'both' || !hoverable()) {
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

  const positioner = {
    props: () => defaultProps(),
    ...positioning,
  };

  const state = createMemo<TooltipPositioner.State>(() => ({
    open: open(),
    side: positioner.side(),
    align: positioner.align(),
    anchorHidden: positioner.anchorHidden(),
  }));

  const contextValue: TooltipPositionerContext = {
    open: () => state().open,
    side: () => state().side,
    align: () => state().align,
    anchorHidden: () => state().anchorHidden,
    arrowRef: positioner.refs.arrowRef,
    setArrowRef: positioner.refs.setArrowRef,
    arrowStyles: positioner.arrowStyles,
    arrowUncentered: positioner.arrowUncentered,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setPositionerElement,
    props: [positioner.props, elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <TooltipPositionerContext.Provider value={contextValue}>
      {element()}
    </TooltipPositionerContext.Provider>
  );
}

export namespace TooltipPositioner {
  export interface State {
    /**
     * Whether the tooltip is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends BaseUIComponentProps<'div', State>,
      Omit<useAnchorPositioning.SharedParameters, 'side'> {
    /**
     * Which side of the anchor element to align the popup against.
     * May automatically change to avoid collisions.
     * @default 'top'
     */
    side?: MaybeAccessor<Side | undefined>;
  }
}
