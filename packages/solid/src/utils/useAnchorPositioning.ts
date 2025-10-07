'use client';

import { getAlignment, getSide, getSideAxis, type Rect } from '@floating-ui/utils';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Accessor,
  type JSX,
  type Setter,
} from 'solid-js';
import { useDirection } from '../direction-provider/DirectionContext';
import {
  arrow,
  autoUpdate,
  flip,
  hide,
  limitShift,
  offset,
  shift,
  size,
  useFloating,
  type AutoUpdateOptions,
  type FloatingContext,
  type FloatingRootContext,
  type Middleware,
  type MiddlewareState,
  type Padding,
  type Side as PhysicalSide,
  type Placement,
  type UseFloatingOptions,
  type VirtualElement,
} from '../floating-ui-solid/index';
import { access, type MaybeAccessor, type MaybeAccessorValue } from '../solid-helpers';
import { ownerDocument } from './owner';

function getLogicalSide(sideParam: Side, renderedSide: PhysicalSide, isRtl: boolean): Side {
  const isLogicalSideParam = sideParam === 'inline-start' || sideParam === 'inline-end';
  const logicalRight = isRtl ? 'inline-start' : 'inline-end';
  const logicalLeft = isRtl ? 'inline-end' : 'inline-start';
  return (
    {
      top: 'top',
      right: isLogicalSideParam ? logicalRight : 'right',
      bottom: 'bottom',
      left: isLogicalSideParam ? logicalLeft : 'left',
    } satisfies Record<PhysicalSide, Side>
  )[renderedSide];
}

function getOffsetData(state: MiddlewareState, sideParam: Side, isRtl: boolean) {
  const { rects, placement } = state;
  const data = {
    side: getLogicalSide(sideParam, getSide(placement), isRtl),
    align: getAlignment(placement) || 'center',
    anchor: { width: rects.reference.width, height: rects.reference.height },
    positioner: { width: rects.floating.width, height: rects.floating.height },
  } as const;
  return data;
}

export type Side = 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start';
export type Align = 'start' | 'center' | 'end';
export type Boundary = 'clipping-ancestors' | Element | Element[] | Rect;
export type OffsetFunction = (data: {
  side: Side;
  align: Align;
  anchor: { width: number; height: number };
  positioner: { width: number; height: number };
}) => number;

interface SideFlipMode {
  /**
   * How to avoid collisions on the side axis.
   */
  side?: 'flip' | 'none';
  /**
   * How to avoid collisions on the align axis.
   */
  align?: 'flip' | 'shift' | 'none';
  /**
   * If both sides on the preferred axis do not fit, determines whether to fallback
   * to a side on the perpendicular axis and which logical side to prefer.
   */
  fallbackAxisSide?: 'start' | 'end' | 'none';
}

interface SideShiftMode {
  /**
   * How to avoid collisions on the side axis.
   */
  side?: 'shift' | 'none';
  /**
   * How to avoid collisions on the align axis.
   */
  align?: 'shift' | 'none';
  /**
   * If both sides on the preferred axis do not fit, determines whether to fallback
   * to a side on the perpendicular axis and which logical side to prefer.
   */
  fallbackAxisSide?: 'start' | 'end' | 'none';
}

export type CollisionAvoidance = SideFlipMode | SideShiftMode;

/**
 * Provides standardized anchor positioning behavior for floating elements. Wraps Floating UI's
 * `useFloating` hook.
 */
export function useAnchorPositioning(
  params: useAnchorPositioning.Parameters,
): useAnchorPositioning.ReturnValue {
  // Public parameters
  const anchor = createMemo(() => access(params.anchor));
  const positionMethod = () => access(params.positionMethod) ?? 'absolute';
  const sideParam = () => access(params.side) ?? 'bottom';
  const sideOffset = () => access(params.sideOffset) ?? 0;
  const align = () => access(params.align) ?? 'center';
  const alignOffset = () => access(params.alignOffset) ?? 0;
  const collisionBoundary = () => access(params.collisionBoundary);
  const collisionPadding = () => access(params.collisionPadding) ?? 5;
  const sticky = () => access(params.sticky) ?? false;
  const arrowPadding = () => access(params.arrowPadding) ?? 5;
  const trackAnchor = () => access(params.trackAnchor) ?? true;
  // Private parameters
  const keepMounted = () => access(params.keepMounted) ?? false;
  const mounted = () => access(params.mounted);
  const collisionAvoidance = () => access(params.collisionAvoidance);
  const shiftCrossAxis = () => access(params.shiftCrossAxis) ?? false;
  const nodeId = () => access(params.nodeId);
  const adaptiveOrigin = () => access(params.adaptiveOrigin);

  const collisionAvoidanceSide = () => collisionAvoidance().side || 'flip';
  const collisionAvoidanceAlign = () => collisionAvoidance().align || 'flip';
  const collisionAvoidanceFallbackAxisSide = () => collisionAvoidance().fallbackAxisSide || 'end';

  const anchorValueRef = anchor();

  const direction = useDirection();
  const isRtl = () => direction() === 'rtl';

  const side = createMemo(
    () =>
      (
        ({
          top: 'top',
          right: 'right',
          bottom: 'bottom',
          left: 'left',
          'inline-end': isRtl() ? 'left' : 'right',
          'inline-start': isRtl() ? 'right' : 'left',
        }) satisfies Record<Side, PhysicalSide>
      )[sideParam()],
  );

  const placement = () => (align() === 'center' ? side() : (`${side()}-${align()}` as Placement));

  const commonCollisionProps = createMemo(() => {
    const boundary = collisionBoundary();
    return {
      boundary: boundary === 'clipping-ancestors' ? 'clippingAncestors' : boundary,
      padding: collisionPadding(),
    } as const;
  });

  // Using a ref assumes that the arrow element is always present in the DOM for the lifetime of the
  // popup. If this assumption ends up being false, we can switch to state to manage the arrow's
  // presence.
  const [arrowRef, setArrowRef] = createSignal<Element | null | undefined>(null);
  const shiftDisabled = () =>
    collisionAvoidanceAlign() === 'none' && collisionAvoidanceSide() !== 'shift';
  const crossAxisShiftEnabled = () =>
    !shiftDisabled() && (sticky() || shiftCrossAxis() || collisionAvoidanceSide() === 'shift');

  const offsetMiddleware = createMemo<Middleware>(() => {
    const sideOffsetRef = sideOffset();
    const alignOffsetRef = alignOffset();

    return offset((state) => {
      const data = getOffsetData(state, sideParam(), isRtl());

      const sideAxis = typeof sideOffsetRef === 'function' ? sideOffsetRef(data) : sideOffsetRef;
      const alignAxis =
        typeof alignOffsetRef === 'function' ? alignOffsetRef(data) : alignOffsetRef;

      return {
        mainAxis: sideAxis,
        crossAxis: alignAxis,
        alignmentAxis: alignAxis,
      };
    });
  });

  const flipMiddleware = createMemo<Middleware | null>(() => {
    return collisionAvoidanceSide() === 'none'
      ? null
      : flip({
          ...commonCollisionProps(),
          mainAxis: !shiftCrossAxis() && collisionAvoidanceSide() === 'flip',
          crossAxis: collisionAvoidanceAlign() === 'flip' ? 'alignment' : false,
          fallbackAxisSideDirection: collisionAvoidanceFallbackAxisSide(),
        });
  });

  const shiftMiddleware = createMemo<Middleware | null>(() => {
    return shiftDisabled()
      ? null
      : shift(
          // eslint-disable-next-line solid/reactivity
          (data) => {
            const html = ownerDocument(data.elements.floating).documentElement;
            return {
              ...commonCollisionProps(),
              // Use the Layout Viewport to avoid shifting around when pinch-zooming
              // for context menus.
              rootBoundary: shiftCrossAxis()
                ? { x: 0, y: 0, width: html.clientWidth, height: html.clientHeight }
                : undefined,
              mainAxis: collisionAvoidanceAlign() !== 'none',
              crossAxis: crossAxisShiftEnabled(),
              limiter:
                sticky() || shiftCrossAxis()
                  ? undefined
                  : limitShift(() => {
                      if (!arrowRef()) {
                        return {};
                      }
                      const { height } = arrowRef()!.getBoundingClientRect();
                      const padding = collisionPadding();
                      return {
                        offset: height / 2 + (typeof padding === 'number' ? padding : 0),
                      };
                    }),
            };
          },
        );
  });

  const sizeMiddleware = createMemo<Middleware>(() => {
    return size({
      ...commonCollisionProps(),
      apply({ elements: { floating }, rects: { reference }, availableWidth, availableHeight }) {
        Object.entries({
          '--available-width': `${availableWidth}px`,
          '--available-height': `${availableHeight}px`,
          '--anchor-width': `${reference.width}px`,
          '--anchor-height': `${reference.height}px`,
        }).forEach(([key, value]) => {
          floating.style.setProperty(key, value);
        });
      },
    });
  });

  const arrowMiddleware = createMemo<Middleware>(() => {
    return arrow(() => ({
      // `transform-origin` calculations rely on an element existing. If the arrow hasn't been set,
      // we'll create a fake element.
      element: arrowRef() || document.createElement('div'),
      padding: arrowPadding(),
    }));
  });

  const transformOriginMiddleware = createMemo<Middleware>(() => {
    return {
      name: 'transformOrigin',
      fn(state) {
        const { elements, middlewareData, placement: renderedPlacement, rects, y } = state;

        const currentRenderedSide = getSide(renderedPlacement);
        const currentRenderedAxis = getSideAxis(currentRenderedSide);
        const arrowX = middlewareData.arrow?.x || 0;
        const arrowY = middlewareData.arrow?.y || 0;
        const arrowWidth = arrowRef()?.clientWidth || 0;
        const arrowHeight = arrowRef()?.clientHeight || 0;
        const transformX = arrowX + arrowWidth / 2;
        const transformY = arrowY + arrowHeight / 2;
        const shiftY = Math.abs(middlewareData.shift?.y || 0);
        const halfAnchorHeight = rects.reference.height / 2;
        const sideOffsetValue = sideOffset();
        const isOverlappingAnchor =
          shiftY >
          (typeof sideOffsetValue === 'function'
            ? sideOffsetValue(getOffsetData(state, sideParam(), isRtl()))
            : sideOffsetValue);

        const adjacentTransformOrigin = {
          top: `${transformX}px calc(100% + ${sideOffsetValue}px)`,
          bottom: `${transformX}px ${-sideOffsetValue}px`,
          left: `calc(100% + ${sideOffsetValue}px) ${transformY}px`,
          right: `${-sideOffsetValue}px ${transformY}px`,
        }[currentRenderedSide];
        const overlapTransformOrigin = `${transformX}px ${rects.reference.y + halfAnchorHeight - y}px`;

        elements.floating.style.setProperty(
          '--transform-origin',
          crossAxisShiftEnabled() && currentRenderedAxis === 'y' && isOverlappingAnchor
            ? overlapTransformOrigin
            : adjacentTransformOrigin,
        );

        return {};
      },
    };
  });

  const middleware = createMemo(() => {
    const middlewareArray: MaybeAccessorValue<UseFloatingOptions['middleware']> = [
      offsetMiddleware(),
    ];

    // https://floating-ui.com/docs/flip#combining-with-shift
    if (
      collisionAvoidanceSide() === 'shift' ||
      collisionAvoidanceAlign() === 'shift' ||
      align() === 'center'
    ) {
      middlewareArray.push(shiftMiddleware(), flipMiddleware());
    } else {
      middlewareArray.push(flipMiddleware(), shiftMiddleware());
    }

    middlewareArray.push(
      sizeMiddleware(),
      arrowMiddleware(),
      hide(),
      transformOriginMiddleware(),
      adaptiveOrigin(),
    );

    return middlewareArray;
  });

  // Ensure positioning doesn't run initially for `keepMounted` elements that
  // aren't initially open.
  const rootContext =
    !mounted() && params.floatingRootContext
      ? {
          ...params.floatingRootContext,
          elements: { reference: () => null, floating: () => null, domReference: () => null },
        }
      : params.floatingRootContext;

  const autoUpdateOptions = createMemo<AutoUpdateOptions>(() => ({
    elementResize: trackAnchor() && typeof ResizeObserver !== 'undefined',
    layoutShift: trackAnchor() && typeof IntersectionObserver !== 'undefined',
  }));

  const {
    refs,
    elements,
    x,
    y,
    middlewareData,
    update,
    placement: renderedPlacement,
    context,
    isPositioned,
    floatingStyles: originalFloatingStyles,
  } = useFloating({
    rootContext,
    placement,
    middleware,
    strategy: positionMethod,
    whileElementsMounted: (...args) => {
      const options = autoUpdateOptions();
      return keepMounted() ? () => undefined : () => autoUpdate(...args, options);
    },
    nodeId,
  });

  const floatingStyles = createMemo<JSX.CSSProperties>(() => {
    const { sideX, sideY } = middlewareData().adaptiveOrigin || {};
    return adaptiveOrigin()
      ? { position: positionMethod(), [sideX]: `${x()}px`, [sideY]: `${y()}px` }
      : originalFloatingStyles();
  });

  let registeredPositionReferenceRef: Element | VirtualElement | null = null;

  createEffect(() => {
    if (!mounted()) {
      return;
    }

    const resolvedAnchor = access(anchorValueRef);
    const finalAnchor = resolvedAnchor || null;

    if (finalAnchor !== registeredPositionReferenceRef) {
      refs.setPositionReference(finalAnchor);
      registeredPositionReferenceRef = finalAnchor;
    }
  });

  createEffect(() => {
    if (!mounted()) {
      return;
    }

    // Refs from parent components are set after useLayoutEffect runs and are available in useEffect.
    // Therefore, if the anchor is a ref, we need to update the position reference in useEffect.
    if (typeof anchorValueRef === 'function') {
      return;
    }

    if (anchorValueRef !== registeredPositionReferenceRef) {
      refs.setPositionReference(anchorValueRef || null);
      registeredPositionReferenceRef = anchorValueRef || null;
    }
  });

  createEffect(() => {
    const domReference = elements.domReference();
    const floating = elements.floating();
    if (keepMounted() && mounted() && domReference && floating) {
      const cleanup = autoUpdate(domReference, floating, update, autoUpdateOptions());
      onCleanup(cleanup);
    }
  });

  const renderedSide = () => getSide(renderedPlacement());
  const logicalRenderedSide = () => getLogicalSide(sideParam(), renderedSide(), isRtl());
  const renderedAlign = () => getAlignment(renderedPlacement()) || 'center';
  const anchorHidden = () => Boolean(middlewareData().hide?.referenceHidden);

  const arrowStyles = createMemo<JSX.CSSProperties>(() => ({
    position: 'absolute' as const,
    top: `${middlewareData().arrow?.y || 0}px`,
    left: `${middlewareData().arrow?.x || 0}px`,
  }));

  const arrowUncentered = () => middlewareData().arrow?.centerOffset !== 0;

  return {
    positionerStyles: floatingStyles,
    arrowStyles,
    arrowUncentered,
    side: logicalRenderedSide,
    align: renderedAlign,
    anchorHidden,
    refs: {
      ...refs,
      arrowRef,
      setArrowRef,
    },
    context,
    isPositioned,
    update,
  };
}

export namespace useAnchorPositioning {
  export interface SharedParameters {
    /**
     * An element to position the popup against.
     * By default, the popup will be positioned against the trigger.
     */
    anchor?: MaybeAccessor<
      Element | null | VirtualElement | (() => Element | VirtualElement | null) | undefined
    >;
    /**
     * Determines which CSS `position` property to use.
     * @default 'absolute'
     */
    positionMethod?: MaybeAccessor<'absolute' | 'fixed' | undefined>;
    /**
     * Which side of the anchor element to align the popup against.
     * May automatically change to avoid collisions.
     * @default 'bottom'
     */
    side?: MaybeAccessor<Side | undefined>;
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
    sideOffset?: MaybeAccessor<number | OffsetFunction | undefined>;
    /**
     * How to align the popup relative to the specified side.
     * @default 'center'
     */
    align?: MaybeAccessor<'start' | 'end' | 'center' | undefined>;
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
    alignOffset?: MaybeAccessor<number | OffsetFunction | undefined>;
    /**
     * An element or a rectangle that delimits the area that the popup is confined to.
     * @default 'clipping-ancestors'
     */
    collisionBoundary?: MaybeAccessor<Boundary | undefined>;
    /**
     * Additional space to maintain from the edge of the collision boundary.
     * @default 5
     */
    collisionPadding?: MaybeAccessor<Padding | undefined>;
    /**
     * Whether to maintain the popup in the viewport after
     * the anchor element was scrolled out of view.
     * @default false
     */
    sticky?: MaybeAccessor<boolean | undefined>;
    /**
     * Minimum distance to maintain between the arrow and the edges of the popup.
     *
     * Use it to prevent the arrow element from hanging out of the rounded corners of a popup.
     * @default 5
     */
    arrowPadding?: MaybeAccessor<number | undefined>;
    /**
     * Whether the popup tracks any layout shift of its positioning anchor.
     * @default true
     */
    trackAnchor?: MaybeAccessor<boolean | undefined>;
    /**
     * Determines how to handle collisions when positioning the popup.
     */
    collisionAvoidance?: MaybeAccessor<CollisionAvoidance | undefined>;
  }

  export interface Parameters extends SharedParameters {
    keepMounted?: MaybeAccessor<boolean | undefined>;
    trackCursorAxis?: MaybeAccessor<'none' | 'x' | 'y' | 'both' | undefined>;
    floatingRootContext?: FloatingRootContext;
    mounted: MaybeAccessor<boolean>;
    trackAnchor: MaybeAccessor<boolean>;
    nodeId?: MaybeAccessor<string | undefined>;
    adaptiveOrigin?: MaybeAccessor<Middleware | undefined>;
    collisionAvoidance: MaybeAccessor<CollisionAvoidance>;
    shiftCrossAxis?: MaybeAccessor<boolean | undefined>;
  }

  export interface ReturnValue {
    positionerStyles: Accessor<JSX.CSSProperties>;
    arrowStyles: Accessor<JSX.CSSProperties>;
    arrowUncentered: Accessor<boolean>;
    side: Accessor<Side>;
    align: Accessor<Align>;
    anchorHidden: Accessor<boolean>;
    refs: ReturnType<typeof useFloating>['refs'] & {
      arrowRef: Accessor<Element | null | undefined>;
      setArrowRef: Setter<Element | null | undefined>;
    };
    context: FloatingContext;
    isPositioned: Accessor<boolean>;
    update: () => void;
  }
}
