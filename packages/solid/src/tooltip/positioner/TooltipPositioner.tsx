'use client';
import { mergeProps, type JSX } from 'solid-js';
import type { Padding, VirtualElement } from '../../floating-ui-solid';
import { splitComponentProps } from '../../solid-helpers';
import { POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import {
  useAnchorPositioning,
  type Align,
  type Boundary,
  type CollisionAvoidance,
  type OffsetFunction,
  type Side,
} from '../../utils/useAnchorPositioning';
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
  const positionMethod = () => local.positionMethod ?? 'absolute';
  const side = () => local.side ?? 'top';
  const align = () => local.align ?? 'center';
  const sideOffset = () => local.sideOffset ?? 0;
  const alignOffset = () => local.alignOffset ?? 0;
  const collisionBoundary = () => local.collisionBoundary ?? 'clipping-ancestors';
  const collisionPadding = () => local.collisionPadding ?? 5;
  const arrowPadding = () => local.arrowPadding ?? 5;
  const sticky = () => local.sticky ?? false;
  const trackAnchor = () => local.trackAnchor ?? true;
  const collisionAvoidance = () => local.collisionAvoidance ?? POPUP_COLLISION_AVOIDANCE;

  const { open, setPositionerElement, mounted, floatingRootContext, trackCursorAxis, hoverable } =
    useTooltipRootContext();
  const keepMounted = useTooltipPortalContext();

  const positioning = useAnchorPositioning({
    anchor: () => local.anchor,
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

  const defaultProps: HTMLProps = {
    role: 'presentation',
    get hidden() {
      return !mounted();
    },
    get style() {
      const hiddenStyles: JSX.CSSProperties = {};

      if (!open() || trackCursorAxis() === 'both' || !hoverable()) {
        hiddenStyles['pointer-events'] = 'none';
      }

      return {
        ...positioning.positionerStyles(),
        ...hiddenStyles,
      };
    },
  };

  const positioner = mergeProps(positioning, { props: defaultProps });

  const state: TooltipPositioner.State = {
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

  const contextValue: TooltipPositionerContext = {
    open: () => state.open,
    side: () => state.side,
    align: () => state.align,
    anchorHidden: () => state.anchorHidden,
    arrowRef: () => positioner.refs.arrowRef(),
    // eslint-disable-next-line solid/reactivity
    setArrowRef: positioner.refs.setArrowRef,
    arrowStyles: () => positioner.arrowStyles(),
    arrowUncentered: () => positioner.arrowUncentered(),
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setPositionerElement,
    // eslint-disable-next-line solid/reactivity
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
    side?: Side;
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
