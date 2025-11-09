import { isElement } from '@floating-ui/utils/dom';
import { createEffect, createMemo, on, onCleanup, type Accessor } from 'solid-js';
import { useTimeout } from '../../utils/useTimeout';
import { contains, getDocument, isMouseLikePointerType } from '../utils';

import type { MaybeAccessor } from '../../solid-helpers';
import { access } from '../../solid-helpers';
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
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'function') {
    const result = value();
    if (typeof result === 'number') {
      return result;
    }
    return result?.[prop];
  }

  return value?.[prop];
}

export interface UseHoverProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean | undefined>;
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
  restMs?: MaybeAccessor<number | undefined>;
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  delay?: MaybeAccessor<Delay | undefined>;
  /**
   * Whether the logic only runs for mouse input, ignoring touch input.
   * Note: due to a bug with Linux Chrome, "pen" inputs are considered "mouse".
   * @default false
   */
  mouseOnly?: MaybeAccessor<boolean | undefined>;
  /**
   * Whether moving the cursor over the floating element will open it, without a
   * regular hover event required.
   * @default true
   */
  move?: MaybeAccessor<boolean | undefined>;
}

/**
 * Opens the floating element while hovering over the reference element, like
 * CSS `:hover`.
 * @see https://floating-ui.com/docs/useHover
 */
export function useHover(
  contextProp: MaybeAccessor<FloatingRootContext>,
  props: UseHoverProps = {},
): Accessor<ElementProps> {
  const enabled = () => access(props.enabled) ?? true;
  const delay = () => access(props.delay) ?? 0;
  const mouseOnly = () => access(props.mouseOnly) ?? false;
  const restMs = () => access(props.restMs) ?? 0;
  const move = () => access(props.move) ?? true;
  const context = () => access(contextProp);

  const tree = useFloatingTree();
  const parentId = useFloatingParentNodeId();

  let pointerTypeRef: string | undefined;
  const timeout = useTimeout();
  const restTimeout = useTimeout();
  let blockMouseMoveRef = true;
  let performedPointerEventsMutationRef = false;
  let restTimeoutPendingRef = false;
  let unbindMouseMoveRef = () => {};

  const isHoverOpen = () => {
    const type = context().dataRef.openEvent?.type;
    return type?.includes('mouse') && type !== 'mousedown';
  };

  function onOpenChangeLocal({ open: newOpen }: { open: boolean }) {
    if (!newOpen) {
      timeout.clear();
      restTimeout.clear();
      blockMouseMoveRef = true;
      restTimeoutPendingRef = false;
    }
  }

  function onLeave(event: MouseEvent) {
    if (isHoverOpen()) {
      context().onOpenChange(false, event, 'hover');
    }
  }

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    context().events.on('openchange', onOpenChangeLocal);
    onCleanup(() => {
      context().events.off('openchange', onOpenChangeLocal);
    });
  });

  createEffect(() => {
    if (!enabled()) {
      return;
    }
    if (!props.handleClose) {
      return;
    }
    if (!context().open()) {
      return;
    }

    const floating = context().elements.floating();
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
    const closeDelay = getDelay(delay(), 'close', pointerTypeRef);
    if (closeDelay) {
      timeout.start(closeDelay, () => context().onOpenChange(false, event, reason));
    } else if (runElseBranch) {
      timeout.clear();
      context().onOpenChange(false, event, reason);
    }
  };

  const cleanupMouseMoveHandler = () => {
    unbindMouseMoveRef();
  };

  const clearPointerEvents = () => {
    if (performedPointerEventsMutationRef) {
      const floating = context().elements.floating();
      const body = getDocument(floating).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef = false;
    }
  };

  const isClickLikeOpenEvent = () => {
    const openEvent = context().dataRef.openEvent;
    return openEvent ? ['click', 'mousedown'].includes(openEvent.type) : false;
  };

  function onReferenceMouseEnter(event: MouseEvent) {
    timeout.clear();
    blockMouseMoveRef = false;

    if (
      (mouseOnly() && !isMouseLikePointerType(pointerTypeRef)) ||
      (restMs() > 0 && !getDelay(delay(), 'open'))
    ) {
      return;
    }

    const openDelay = getDelay(delay(), 'open', pointerTypeRef);

    if (openDelay) {
      timeout.start(openDelay, () => {
        if (!context().open()) {
          context().onOpenChange(true, event, 'hover');
        }
      });
    } else if (!context().open()) {
      context().onOpenChange(true, event, 'hover');
    }
  }

  function onReferenceMouseLeave(event: MouseEvent) {
    if (isClickLikeOpenEvent()) {
      clearPointerEvents();
      return;
    }

    unbindMouseMoveRef();

    const floating = context().elements.floating();
    const doc = getDocument(floating);
    restTimeout.clear();
    restTimeoutPendingRef = false;

    if (props.handleClose && context().dataRef.floatingContext) {
      // Prevent clearing `onScrollMouseLeave` timeout.
      if (!context().open()) {
        timeout.clear();
      }

      const handler = props.handleClose({
        ...context().dataRef.floatingContext,
        ...(context().dataRef.floatingContext?.storeData as any),
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
        ? !contains(context().elements.floating(), event.relatedTarget as Element | null)
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
    if (!context().dataRef.floatingContext) {
      return;
    }

    props.handleClose?.({
      ...context().dataRef.floatingContext,
      ...(context().dataRef.floatingContext?.storeData as any),
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

  // Registering the mouse events on the reference directly to bypass React's
  // delegation system. If the cursor was on a disabled element and then entered
  // the reference (no gap), `mouseenter` doesn't fire in the delegation system.
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    const domReference = context().elements.domReference();
    if (isElement(domReference)) {
      const reference = domReference as HTMLElement;
      const floating = context().elements.floating();

      if (context().open()) {
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
        if (context().open()) {
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
    if (context().open() && props.handleClose?.__options?.blockPointerEvents && isHoverOpen()) {
      performedPointerEventsMutationRef = true;
      const floatingEl = context().elements.floating();
      const domReference = context().elements.domReference();

      if (isElement(domReference) && floatingEl) {
        const body = getDocument(floatingEl).body;
        body.setAttribute(safePolygonIdentifier, '');

        const ref = domReference as unknown as HTMLElement | SVGSVGElement;

        const parentNode = tree?.nodesRef.find((node) => node.id === parentId);
        const parentFloating = parentNode
          ? access(parentNode.context)?.elements.floating()
          : undefined;

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
    if (!context().open()) {
      pointerTypeRef = undefined;
      restTimeoutPendingRef = false;
      cleanupMouseMoveHandler();
      clearPointerEvents();
    }
  });

  createEffect(
    on([enabled, () => context().elements.domReference()], () => {
      onCleanup(() => {
        cleanupMouseMoveHandler();
        timeout.clear();
        restTimeout.clear();
        clearPointerEvents();
      });
    }),
  );
  const reference = createMemo<ElementProps['reference']>(() => {
    function setPointerRef(event: PointerEvent) {
      pointerTypeRef = event.pointerType;
    }

    return {
      ref: () => {
        onCleanup(() => {
          // @ts-expect-error even though its not in the types this is valid
          context().refs.setReference(null);
        });
      },
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove: (event) => {
        function handleMouseMove() {
          if (!blockMouseMoveRef && !context().open()) {
            context().onOpenChange(true, event, 'hover');
          }
        }

        if (mouseOnly() && !isMouseLikePointerType(pointerTypeRef)) {
          return;
        }

        if (context().open() || restMs() === 0) {
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

  const returnValue = createMemo<ElementProps>(() => {
    if (!enabled()) {
      return {};
    }

    return { reference: reference() };
  });

  return returnValue;
}
