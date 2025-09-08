import { getWindow } from '@floating-ui/utils/dom';
import { createEffect, createMemo, createSignal, onCleanup, type Accessor } from 'solid-js';
import type { ContextData, ElementProps, FloatingRootContext } from '../types';
import { contains, getTarget, isMouseLikePointerType } from '../utils';

function createVirtualElement(
  domElement: Element | null | undefined,
  data: {
    axis: 'x' | 'y' | 'both';
    dataRef: ContextData;
    pointerType: string | undefined;
    x: number | null;
    y: number | null;
  },
) {
  let offsetX: number | null = null;
  let offsetY: number | null = null;
  let isAutoUpdateEvent = false;

  return {
    contextElement: domElement || undefined,
    getBoundingClientRect() {
      const domRect = domElement?.getBoundingClientRect() || {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      };

      const isXAxis = data.axis === 'x' || data.axis === 'both';
      const isYAxis = data.axis === 'y' || data.axis === 'both';
      const canTrackCursorOnAutoUpdate =
        ['mouseenter', 'mousemove'].includes(data.dataRef.openEvent?.type || '') &&
        data.pointerType !== 'touch';

      let width = domRect.width;
      let height = domRect.height;
      let x = domRect.x;
      let y = domRect.y;

      if (offsetX == null && data.x && isXAxis) {
        offsetX = domRect.x - data.x;
      }

      if (offsetY == null && data.y && isYAxis) {
        offsetY = domRect.y - data.y;
      }

      x -= offsetX || 0;
      y -= offsetY || 0;
      width = 0;
      height = 0;

      if (!isAutoUpdateEvent || canTrackCursorOnAutoUpdate) {
        width = data.axis === 'y' ? domRect.width : 0;
        height = data.axis === 'x' ? domRect.height : 0;
        x = isXAxis && data.x != null ? data.x : x;
        y = isYAxis && data.y != null ? data.y : y;
      } else if (isAutoUpdateEvent && !canTrackCursorOnAutoUpdate) {
        height = data.axis === 'x' ? domRect.height : height;
        width = data.axis === 'y' ? domRect.width : width;
      }

      isAutoUpdateEvent = true;

      return {
        width,
        height,
        x,
        y,
        top: y,
        right: x + width,
        bottom: y + height,
        left: x,
      };
    },
  };
}

function isMouseBasedEvent(event: Event | null): event is MouseEvent {
  return event != null && (event as MouseEvent).clientX != null;
}

export interface UseClientPointProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: Accessor<boolean | undefined>;
  /**
   * Whether to restrict the client point to an axis and use the reference
   * element (if it exists) as the other axis. This can be useful if the
   * floating element is also interactive.
   * @default 'both'
   */
  axis?: Accessor<'x' | 'y' | 'both' | undefined>;
  /**
   * An explicitly defined `x` client coordinate.
   * @default null
   */
  x?: Accessor<number | null | undefined>;
  /**
   * An explicitly defined `y` client coordinate.
   * @default null
   */
  y?: Accessor<number | null | undefined>;
}

/**
 * Positions the floating element relative to a client point (in the viewport),
 * such as the mouse position. By default, it follows the mouse cursor.
 * @see https://floating-ui.com/docs/useClientPoint
 */
export function useClientPoint(
  context: FloatingRootContext,
  props: UseClientPointProps = {},
): Accessor<ElementProps> {
  const enabled = () => props.enabled?.() ?? true;
  const axis = () => props.axis?.() ?? 'both';
  const x = () => props.x?.() ?? null;
  const y = () => props.y?.() ?? null;
  const floating = () => context.elements.floating?.();
  const domReference = () => context.elements.domReference?.();

  let initialRef = false;

  const [pointerType, setPointerType] = createSignal<string | undefined>();

  const setReference = (newX: number | null, newY: number | null) => {
    if (initialRef) {
      return;
    }

    // Prevent setting if the open event was not a mouse-like one
    // (e.g. focus to open, then hover over the reference element).
    // Only apply if the event exists.
    if (context.dataRef.openEvent && !isMouseBasedEvent(context.dataRef.openEvent)) {
      return;
    }

    context.refs.setPositionReference(
      createVirtualElement(domReference(), {
        x: newX,
        y: newY,
        axis: axis(),
        dataRef: context.dataRef,
        pointerType: pointerType(),
      }),
    );
  };

  const handleReferenceEnterOrMove = (event: MouseEvent) => {
    if (x() != null || y() != null) {
      return;
    }

    if (!context.open()) {
      setReference(event.clientX, event.clientY);
    }
  };

  // If the pointer is a mouse-like pointer, we want to continue following the
  // mouse even if the floating element is transitioning out. On touch
  // devices, this is undesirable because the floating element will move to
  // the dismissal touch point.
  const openCheck = () => {
    return isMouseLikePointerType(pointerType()) ? floating() : context.open();
  };

  function handleMouseMove(event: MouseEvent) {
    const target = getTarget(event) as Element | null;

    const win = getWindow(floating());

    if (!contains(floating(), target)) {
      setReference(event.clientX, event.clientY);
    } else {
      win.removeEventListener('mousemove', handleMouseMove);
    }
  }

  createEffect(() => {
    if (!openCheck() || !enabled() || x() != null || y() != null) {
      return;
    }

    const win = getWindow(floating());

    if (!context.dataRef.openEvent || isMouseBasedEvent(context.dataRef.openEvent)) {
      win.addEventListener('mousemove', handleMouseMove);

      onCleanup(() => {
        win.removeEventListener('mousemove', handleMouseMove);
      });
      return;
    }

    context.refs.setPositionReference(domReference());
  });

  createEffect(() => {
    if (enabled() && !floating()) {
      initialRef = false;
    }
  });

  createEffect(() => {
    if (!enabled() && context.open()) {
      initialRef = true;
    }
  });

  createEffect(() => {
    if (enabled() && (x() != null || y() != null)) {
      initialRef = false;
      setReference(x(), y());
    }
  });

  const reference = createMemo<ElementProps['reference']>(() => {
    function setPointerTypeRef(event: PointerEvent) {
      setPointerType(event.pointerType);
    }

    return {
      'on:pointerdown': setPointerTypeRef,
      'on:pointerenter': setPointerTypeRef,
      'on:mousemove': handleReferenceEnterOrMove,
      'on:mouseenter': handleReferenceEnterOrMove,
    };
  });

  const returnValue = createMemo<ElementProps>(() => {
    if (!enabled()) {
      return {};
    }

    return { reference: reference() };
  });

  return returnValue;
}
