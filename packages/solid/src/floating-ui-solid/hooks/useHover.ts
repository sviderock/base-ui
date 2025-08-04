import { isElement } from '@floating-ui/utils/dom';
import { createEffect, createMemo, on, onCleanup, type Accessor } from 'solid-js';
import { useTimeout } from '../../utils/useTimeout';
import { contains, getDocument, isMouseLikePointerType } from '../utils';

import { useFloatingParentNodeId, useFloatingTree } from '../components/FloatingTree';
import type {
  Delay,
  ElementProps,
  FloatingContext,
  FloatingRootContext,
  FloatingTreeType,
  OpenChangeReason,
  SafePolygonOptions,
} from '../types';
import { createAttribute } from '../utils/createAttribute';

const safePolygonIdentifier = createAttribute('safe-polygon');

export interface HandleCloseContext extends FloatingContext {
  onClose: () => void;
  tree?: FloatingTreeType | null;
  leave?: boolean;
}

export interface HandleClose {
  (context: HandleCloseContext): (event: MouseEvent) => void;
  __options?: SafePolygonOptions;
}

export function getDelay(
  value: UseHoverProps['delay'],
  prop: 'open' | 'close',
  pointerType?: PointerEvent['pointerType'],
) {
  const val = value?.();
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof val === 'number') {
    return val;
  }

  return val?.[prop];
}

export interface UseHoverProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: Accessor<boolean>;
  /**
   * Accepts an event handler that runs on `mousemove` to control when the
   * floating element closes once the cursor leaves the reference element.
   * @default null
   */
  handleClose?: HandleClose | null;
  /**
   * Waits until the user’s cursor is at “rest” over the reference element
   * before changing the `open` state.
   * @default 0
   */
  restMs?: Accessor<number>;
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  delay?: Accessor<Delay>;
  /**
   * Whether the logic only runs for mouse input, ignoring touch input.
   * Note: due to a bug with Linux Chrome, "pen" inputs are considered "mouse".
   * @default false
   */
  mouseOnly?: Accessor<boolean>;
  /**
   * Whether moving the cursor over the floating element will open it, without a
   * regular hover event required.
   * @default true
   */
  move?: Accessor<boolean>;
}

/**
 * Opens the floating element while hovering over the reference element, like
 * CSS `:hover`.
 * @see https://floating-ui.com/docs/useHover
 */
export function useHover(
  context: FloatingRootContext,
  props: UseHoverProps = {},
): Accessor<ElementProps> {
  const enabled = () => props.enabled?.() ?? true;
  const delay = () => props.delay?.() ?? 0;
  const mouseOnly = () => props.mouseOnly?.() ?? false;
  const restMs = () => props.restMs?.() ?? 0;
  const move = () => props.move?.() ?? true;

  const tree = useFloatingTree();
  const parentId = useFloatingParentNodeId();

  let pointerTypeRef: string | undefined;
  const timeout = useTimeout();
  const restTimeout = useTimeout();
  let blockMouseMoveRef = true;
  let performedPointerEventsMutationRef = false;
  let restTimeoutPendingRef = false;
  let handlerRef: ((event: MouseEvent) => void) | undefined;
  let unbindMouseMoveRef = () => {};

  const isHoverOpen = () => {
    const type = context.dataRef.openEvent?.type;
    return type?.includes('mouse') && type !== 'mousedown';
  };

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    function onOpenChangeLocal({ open: newOpen }: { open: boolean }) {
      if (!newOpen) {
        timeout.clear();
        restTimeout.clear();
        blockMouseMoveRef = true;
        restTimeoutPendingRef = false;
      }
    }

    context.events.on('openchange', onOpenChangeLocal);
    onCleanup(() => {
      context.events.off('openchange', onOpenChangeLocal);
    });
  });

  createEffect(() => {
    if (!enabled()) {
      return;
    }
    if (!props.handleClose) {
      return;
    }
    if (!context.open()) {
      return;
    }

    function onLeave(event: MouseEvent) {
      if (isHoverOpen()) {
        context.onOpenChange(false, event, 'hover');
      }
    }

    const floating = context.elements.floating();
    const html = getDocument(floating).documentElement;
    html.addEventListener('mouseleave', onLeave);
    onCleanup(() => {
      html.removeEventListener('mouseleave', onLeave);
    });
  });

  const closeWithDelay = (
    event: Event,
    runElseBranch = true,
    reason: OpenChangeReason = 'hover',
  ) => {
    const closeDelay = getDelay(delay, 'close', pointerTypeRef);
    if (closeDelay && !handlerRef) {
      timeout.start(closeDelay, () => context.onOpenChange(false, event, reason));
    } else if (runElseBranch) {
      timeout.clear();
      context.onOpenChange(false, event, reason);
    }
  };

  const cleanupMouseMoveHandler = () => {
    unbindMouseMoveRef();
    handlerRef = undefined;
  };

  const clearPointerEvents = () => {
    if (performedPointerEventsMutationRef) {
      const floating = context.elements.floating();
      const body = getDocument(floating).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef = false;
    }
  };

  const isClickLikeOpenEvent = () => {
    return context.dataRef.openEvent
      ? ['click', 'mousedown'].includes(context.dataRef.openEvent.type)
      : false;
  };

  // Registering the mouse events on the reference directly to bypass React's
  // delegation system. If the cursor was on a disabled element and then entered
  // the reference (no gap), `mouseenter` doesn't fire in the delegation system.
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    function onReferenceMouseEnter(event: MouseEvent) {
      timeout.clear();
      blockMouseMoveRef = false;

      if (
        (mouseOnly() && !isMouseLikePointerType(pointerTypeRef)) ||
        (restMs() > 0 && !getDelay(delay, 'open'))
      ) {
        return;
      }

      const openDelay = getDelay(delay, 'open', pointerTypeRef);

      if (openDelay) {
        timeout.start(openDelay, () => {
          if (!context.open()) {
            context.onOpenChange(true, event, 'hover');
          }
        });
      } else if (!context.open()) {
        context.onOpenChange(true, event, 'hover');
      }
    }

    function onReferenceMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        clearPointerEvents();
        return;
      }

      unbindMouseMoveRef();

      const floating = context.elements.floating();
      const doc = getDocument(floating);
      restTimeout.clear();
      restTimeoutPendingRef = false;

      if (props.handleClose && context.dataRef.floatingContext) {
        // Prevent clearing `onScrollMouseLeave` timeout.
        if (!context.open()) {
          timeout.clear();
        }

        handlerRef = props.handleClose({
          ...context.dataRef.floatingContext,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            if (!isClickLikeOpenEvent()) {
              closeWithDelay(event, true, 'safe-polygon');
            }
          },
        });

        const handler = handlerRef;

        doc.addEventListener('mousemove', handler);
        unbindMouseMoveRef = () => {
          doc.removeEventListener('mousemove', handler);
        };

        return;
      }

      // Allow interactivity without `safePolygon` on touch devices. With a
      // pointer, a short close delay is an alternative, so it should work
      // consistently.
      const shouldClose =
        pointerTypeRef === 'touch'
          ? !contains(context.elements.floating(), event.relatedTarget as Element | null)
          : true;
      if (shouldClose) {
        closeWithDelay(event);
      }
    }

    // Ensure the floating element closes after scrolling even if the pointer
    // did not move.
    // https://github.com/floating-ui/floating-ui/discussions/1692
    function onScrollMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        return;
      }
      if (!context.dataRef.floatingContext) {
        return;
      }

      props.handleClose?.({
        ...context.dataRef.floatingContext,
        tree,
        x: event.clientX,
        y: event.clientY,
        onClose() {
          clearPointerEvents();
          cleanupMouseMoveHandler();
          if (!isClickLikeOpenEvent()) {
            closeWithDelay(event);
          }
        },
      })(event);
    }

    function onFloatingMouseEnter() {
      timeout.clear();
    }

    function onFloatingMouseLeave(event: MouseEvent) {
      if (!isClickLikeOpenEvent()) {
        closeWithDelay(event, false);
      }
    }

    if (isElement(context.elements.domReference)) {
      const reference = context.elements.domReference as unknown as HTMLElement;
      const floating = context.elements.floating();

      if (context.open()) {
        reference.addEventListener('mouseleave', onScrollMouseLeave);
      }

      if (move()) {
        reference.addEventListener('mousemove', onReferenceMouseEnter, {
          once: true,
        });
      }

      reference.addEventListener('mouseenter', onReferenceMouseEnter);
      reference.addEventListener('mouseleave', onReferenceMouseLeave);

      if (floating) {
        floating.addEventListener('mouseleave', onScrollMouseLeave);
        floating.addEventListener('mouseenter', onFloatingMouseEnter);
        floating.addEventListener('mouseleave', onFloatingMouseLeave);
      }

      onCleanup(() => {
        if (context.open()) {
          reference.removeEventListener('mouseleave', onScrollMouseLeave);
        }

        if (move()) {
          reference.removeEventListener('mousemove', onReferenceMouseEnter);
        }

        reference.removeEventListener('mouseenter', onReferenceMouseEnter);
        reference.removeEventListener('mouseleave', onReferenceMouseLeave);

        if (floating) {
          floating.removeEventListener('mouseleave', onScrollMouseLeave);
          floating.removeEventListener('mouseenter', onFloatingMouseEnter);
          floating.removeEventListener('mouseleave', onFloatingMouseLeave);
        }
      });
    }
  });

  // Block pointer-events of every element other than the reference and floating
  // while the floating element is open and has a `handleClose` handler. Also
  // handles nested floating elements.
  // https://github.com/floating-ui/floating-ui/issues/1722
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    // eslint-disable-next-line no-underscore-dangle
    if (context.open() && props.handleClose?.__options?.blockPointerEvents && isHoverOpen()) {
      performedPointerEventsMutationRef = true;
      const floatingEl = context.elements.floating();
      const domReference = context.elements.domReference();

      if (isElement(domReference) && floatingEl) {
        const body = getDocument(floatingEl).body;
        body.setAttribute(safePolygonIdentifier, '');

        const ref = domReference as unknown as HTMLElement | SVGSVGElement;

        const parentFloating = tree?.nodesRef
          .find((node) => node.id() === parentId())
          ?.context?.elements.floating();

        if (parentFloating) {
          parentFloating.style.pointerEvents = '';
        }

        body.style.pointerEvents = 'none';
        ref.style.pointerEvents = 'auto';
        floatingEl.style.pointerEvents = 'auto';

        onCleanup(() => {
          body.style.pointerEvents = '';
          ref.style.pointerEvents = '';
          floatingEl.style.pointerEvents = '';
        });
      }
    }
  });

  createEffect(() => {
    if (!context.open()) {
      pointerTypeRef = undefined;
      restTimeoutPendingRef = false;
      cleanupMouseMoveHandler();
      clearPointerEvents();
    }
  });

  onCleanup(
    on([enabled, context.elements.domReference, () => timeout, () => restTimeout], () => {
      cleanupMouseMoveHandler();
      timeout.clear();
      restTimeout.clear();
      clearPointerEvents();
    }),
  );

  const reference = createMemo<ElementProps['reference']>(() => {
    function setPointerRef(event: PointerEvent) {
      pointerTypeRef = event.pointerType;
    }

    return {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove(event) {
        function handleMouseMove() {
          if (!blockMouseMoveRef && !context.open()) {
            context.onOpenChange(true, event, 'hover');
          }
        }

        if (mouseOnly() && !isMouseLikePointerType(pointerTypeRef)) {
          return;
        }

        if (context.open() || restMs() === 0) {
          return;
        }

        // Ignore insignificant movements to account for tremors.
        if (restTimeoutPendingRef && event.movementX ** 2 + event.movementY ** 2 < 2) {
          return;
        }

        restTimeout.clear();

        if (pointerTypeRef === 'touch') {
          handleMouseMove();
        } else {
          restTimeoutPendingRef = true;
          restTimeout.start(restMs(), handleMouseMove);
        }
      },
    };
  });

  const returnValue = createMemo<ElementProps>(() => ({
    reference: reference(),
  }));

  return returnValue;
}
