'use client';
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  type ComponentProps,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Accessorify } from '../../floating-ui-solid';
import { activeElement, contains, getTarget } from '../../floating-ui-solid/utils';
import {
  access,
  splitComponentProps,
  type CodepenedentRefs,
  type MaybeAccessor,
} from '../../solid-helpers';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { inertValue } from '../../utils/inertValue';
import { ownerDocument } from '../../utils/owner';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useToastContext } from '../provider/ToastProviderContext';
import type { ToastObject as ToastObjectType } from '../useToastManager';
import { ToastRootContext } from './ToastRootContext';
import { ToastRootCssVars } from './ToastRootCssVars';

const customStyleHookMapping: CustomStyleHookMapping<
  Accessorify<ToastRoot.State, 'maybeAccessor'>
> = {
  ...transitionStatusMapping,
  swipeDirection(value) {
    const val = access(value);
    return val ? { 'data-swipe-direction': val } : null;
  },
};

const SWIPE_THRESHOLD = 40;
const REVERSE_CANCEL_THRESHOLD = 10;
const OPPOSITE_DIRECTION_DAMPING_FACTOR = 0.5;
const MIN_DRAG_THRESHOLD = 1;

function getDisplacement(
  direction: 'up' | 'down' | 'left' | 'right',
  deltaX: number,
  deltaY: number,
) {
  switch (direction) {
    case 'up':
      return -deltaY;
    case 'down':
      return deltaY;
    case 'left':
      return -deltaX;
    case 'right':
      return deltaX;
    default:
      return 0;
  }
}

function getElementTransform(element: HTMLElement) {
  const computedStyle = window.getComputedStyle(element);
  const transform = computedStyle.transform;
  let translateX = 0;
  let translateY = 0;
  let scale = 1;
  if (transform && transform !== 'none') {
    const matrix = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
    if (matrix) {
      const values = matrix[1].split(', ').map(parseFloat);
      if (values.length === 6) {
        translateX = values[4];
        translateY = values[5];
        scale = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
      } else if (values.length === 16) {
        translateX = values[12];
        translateY = values[13];
        scale = values[0];
      }
    }
  }
  return { x: translateX, y: translateY, scale };
}

/**
 * Groups all parts of an individual toast.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastRoot(componentProps: ToastRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['toast', 'swipeDirection']);
  const toast = () => access(local.toast);
  const swipeDirection = () => access(local.swipeDirection) ?? ['down', 'right'];

  const swipeDirections = () =>
    Array.isArray(swipeDirection()) ? swipeDirection() : [swipeDirection()];

  const {
    toasts,
    hovering,
    focused,
    close,
    remove,
    setToasts,
    pauseTimers,
    resumeTimers,
    hasDifferingHeights,
    refs: toastRefs,
  } = useToastContext();

  const [renderScreenReaderContent, setRenderScreenReaderContent] = createSignal(false);
  const [currentSwipeDirection, setCurrentSwipeDirection] = createSignal<
    'up' | 'down' | 'left' | 'right' | undefined
  >(undefined);
  const [isSwiping, setIsSwiping] = createSignal(false);
  const [isRealSwipe, setIsRealSwipe] = createSignal(false);
  const [dragDismissed, setDragDismissed] = createSignal(false);
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [initialTransform, setInitialTransform] = createSignal({ x: 0, y: 0, scale: 1 });
  const [titleId, setTitleId] = createSignal<string | undefined>();
  const [descriptionId, setDescriptionId] = createSignal<string | undefined>();
  const [lockedDirection, setLockedDirection] = createSignal<'horizontal' | 'vertical' | null>(
    null,
  );
  const [codependentRefs, setCodependentRefs] = createStore<
    CodepenedentRefs<['title', 'description']>
  >({});

  const refs: ToastRootContext['refs'] = {
    rootRef: null,
  };

  let dragStartPosRef = { x: 0, y: 0 };
  let initialTransformRef = { x: 0, y: 0, scale: 1 };
  let intendedSwipeDirectionRef = undefined as 'up' | 'down' | 'left' | 'right' | undefined;
  let maxSwipeDisplacementRef = 0;
  let cancelledSwipeRef = false;
  let swipeCancelBaselineRef = { x: 0, y: 0 };
  let isFirstPointerMoveRef = false;

  const domIndex = createMemo(() => toasts.list.indexOf(toast()));
  const visibleIndex = createMemo(() =>
    toasts.list.filter((t) => t.transitionStatus !== 'ending').indexOf(toast()),
  );
  const offsetY = createMemo(() => {
    return toasts.list
      .slice(0, toasts.list.indexOf(toast()))
      .reduce((acc, t) => acc + (t.height || 0), 0);
  });

  useOpenChangeComplete({
    open: () => toast().transitionStatus !== 'ending',
    ref: () => refs.rootRef,
    onComplete() {
      if (toast().transitionStatus === 'ending') {
        remove(toast().id);
      }
    },
  });

  onMount(() => {
    if (typeof ResizeObserver === 'function' && refs.rootRef) {
      const resizeObserver = new ResizeObserver(setHeights);
      resizeObserver.observe(refs.rootRef);
      onCleanup(() => {
        resizeObserver.disconnect();
      });
      return;
    }

    setHeights();
  });

  function setHeights() {
    const height = refs.rootRef?.offsetHeight;
    setToasts('list', (item) => item.id === toast().id, {
      ref: refs.rootRef,
      height,
      transitionStatus: undefined,
    });
  }

  function applyDirectionalDamping(deltaX: number, deltaY: number) {
    let newDeltaX = deltaX;
    let newDeltaY = deltaY;

    if (!swipeDirections().includes('left') && !swipeDirections().includes('right')) {
      newDeltaX =
        deltaX > 0
          ? deltaX ** OPPOSITE_DIRECTION_DAMPING_FACTOR
          : -(Math.abs(deltaX) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
    } else {
      if (!swipeDirections().includes('right') && deltaX > 0) {
        newDeltaX = deltaX ** OPPOSITE_DIRECTION_DAMPING_FACTOR;
      }
      if (!swipeDirections().includes('left') && deltaX < 0) {
        newDeltaX = -(Math.abs(deltaX) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
      }
    }

    if (!swipeDirections().includes('up') && !swipeDirections().includes('down')) {
      newDeltaY =
        deltaY > 0
          ? deltaY ** OPPOSITE_DIRECTION_DAMPING_FACTOR
          : -(Math.abs(deltaY) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
    } else {
      if (!swipeDirections().includes('down') && deltaY > 0) {
        newDeltaY = deltaY ** OPPOSITE_DIRECTION_DAMPING_FACTOR;
      }
      if (!swipeDirections().includes('up') && deltaY < 0) {
        newDeltaY = -(Math.abs(deltaY) ** OPPOSITE_DIRECTION_DAMPING_FACTOR);
      }
    }

    return { x: newDeltaX, y: newDeltaY };
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    if (event.pointerType === 'touch') {
      pauseTimers();
    }

    const target = getTarget(event) as HTMLElement | null;

    const isInteractiveElement = target
      ? target.closest('button,a,input,textarea,[role="button"],[data-swipe-ignore]')
      : false;

    if (isInteractiveElement) {
      return;
    }

    cancelledSwipeRef = false;
    intendedSwipeDirectionRef = undefined;
    maxSwipeDisplacementRef = 0;
    dragStartPosRef = { x: event.clientX, y: event.clientY };
    swipeCancelBaselineRef = dragStartPosRef;

    if (refs.rootRef) {
      const transform = getElementTransform(refs.rootRef);
      initialTransformRef = transform;
      setInitialTransform(transform);
      setDragOffset({
        x: transform.x,
        y: transform.y,
      });
    }

    setIsSwiping(true);
    setIsRealSwipe(false);
    setLockedDirection(null);
    isFirstPointerMoveRef = true;

    refs.rootRef?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isSwiping()) {
      return;
    }

    // Prevent text selection on Safari
    event.preventDefault();

    if (isFirstPointerMoveRef) {
      // Adjust the starting position to the current position on the first move
      // to account for the delay between pointerdown and the first pointermove on iOS.
      dragStartPosRef = { x: event.clientX, y: event.clientY };
      isFirstPointerMoveRef = false;
    }

    const { clientY, clientX, movementX, movementY } = event;

    if (
      (movementY < 0 && clientY > swipeCancelBaselineRef.y) ||
      (movementY > 0 && clientY < swipeCancelBaselineRef.y)
    ) {
      swipeCancelBaselineRef = { x: swipeCancelBaselineRef.x, y: clientY };
    }

    if (
      (movementX < 0 && clientX > swipeCancelBaselineRef.x) ||
      (movementX > 0 && clientX < swipeCancelBaselineRef.x)
    ) {
      swipeCancelBaselineRef = { x: clientX, y: swipeCancelBaselineRef.y };
    }

    const deltaX = clientX - dragStartPosRef.x;
    const deltaY = clientY - dragStartPosRef.y;
    const cancelDeltaY = clientY - swipeCancelBaselineRef.y;
    const cancelDeltaX = clientX - swipeCancelBaselineRef.x;

    if (!isRealSwipe()) {
      const movementDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (movementDistance >= MIN_DRAG_THRESHOLD) {
        setIsRealSwipe(true);
        if (lockedDirection() === null) {
          const hasHorizontal =
            swipeDirections().includes('left') || swipeDirections().includes('right');
          const hasVertical =
            swipeDirections().includes('up') || swipeDirections().includes('down');
          if (hasHorizontal && hasVertical) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            setLockedDirection(absX > absY ? 'horizontal' : 'vertical');
          }
        }
      }
    }

    let candidate: 'up' | 'down' | 'left' | 'right' | undefined;
    if (!intendedSwipeDirectionRef) {
      if (lockedDirection() === 'vertical') {
        if (deltaY > 0) {
          candidate = 'down';
        } else if (deltaY < 0) {
          candidate = 'up';
        }
      } else if (lockedDirection() === 'horizontal') {
        if (deltaX > 0) {
          candidate = 'right';
        } else if (deltaX < 0) {
          candidate = 'left';
        }
      } else if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        candidate = deltaX > 0 ? 'right' : 'left';
      } else {
        candidate = deltaY > 0 ? 'down' : 'up';
      }

      if (candidate && swipeDirections().includes(candidate)) {
        intendedSwipeDirectionRef = candidate;
        maxSwipeDisplacementRef = getDisplacement(candidate, deltaX, deltaY);
        setCurrentSwipeDirection(candidate);
      }
    } else {
      const direction = intendedSwipeDirectionRef;
      const currentDisplacement = getDisplacement(direction, cancelDeltaX, cancelDeltaY);
      if (currentDisplacement > SWIPE_THRESHOLD) {
        cancelledSwipeRef = false;
        setCurrentSwipeDirection(direction);
      } else if (maxSwipeDisplacementRef - currentDisplacement >= REVERSE_CANCEL_THRESHOLD) {
        // Mark that a change-of-mind has occurred
        cancelledSwipeRef = true;
      }
    }

    const dampedDelta = applyDirectionalDamping(deltaX, deltaY);
    let newOffsetX = initialTransformRef.x;
    let newOffsetY = initialTransformRef.y;

    if (lockedDirection() === 'horizontal') {
      if (swipeDirections().includes('left') || swipeDirections().includes('right')) {
        newOffsetX += dampedDelta.x;
      }
    } else if (lockedDirection() === 'vertical') {
      if (swipeDirections().includes('up') || swipeDirections().includes('down')) {
        newOffsetY += dampedDelta.y;
      }
    } else {
      if (swipeDirections().includes('left') || swipeDirections().includes('right')) {
        newOffsetX += dampedDelta.x;
      }
      if (swipeDirections().includes('up') || swipeDirections().includes('down')) {
        newOffsetY += dampedDelta.y;
      }
    }

    setDragOffset({ x: newOffsetX, y: newOffsetY });
  }

  function handlePointerUp(event: PointerEvent) {
    if (!isSwiping()) {
      return;
    }

    if (event.pointerType === 'touch' && !focused()) {
      resumeTimers();
    }

    setIsSwiping(false);
    setIsRealSwipe(false);
    setLockedDirection(null);

    refs.rootRef?.releasePointerCapture(event.pointerId);

    if (cancelledSwipeRef) {
      setDragOffset({ x: initialTransform().x, y: initialTransform().y });
      setCurrentSwipeDirection(undefined);
      return;
    }

    let shouldClose = false;
    const deltaX = dragOffset().x - initialTransform().x;
    const deltaY = dragOffset().y - initialTransform().y;
    let dismissDirection: 'up' | 'down' | 'left' | 'right' | undefined;

    for (const direction of swipeDirections()) {
      switch (direction) {
        case 'right':
          if (deltaX > SWIPE_THRESHOLD) {
            shouldClose = true;
            dismissDirection = 'right';
          }
          break;
        case 'left':
          if (deltaX < -SWIPE_THRESHOLD) {
            shouldClose = true;
            dismissDirection = 'left';
          }
          break;
        case 'down':
          if (deltaY > SWIPE_THRESHOLD) {
            shouldClose = true;
            dismissDirection = 'down';
          }
          break;
        case 'up':
          if (deltaY < -SWIPE_THRESHOLD) {
            shouldClose = true;
            dismissDirection = 'up';
          }
          break;
        default:
          break;
      }
      if (shouldClose) {
        break;
      }
    }

    if (shouldClose) {
      setCurrentSwipeDirection(dismissDirection);
      setDragDismissed(true);
      close(toast().id);
    } else {
      setDragOffset({ x: initialTransform().x, y: initialTransform().y });
      setCurrentSwipeDirection(undefined);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (!refs.rootRef || !contains(refs.rootRef, activeElement(ownerDocument(refs.rootRef)))) {
        return;
      }
      close(toast().id);
    }
  }

  createEffect(() => {
    const element = refs.rootRef;
    if (!element) {
      return;
    }

    function preventDefaultTouchStart(event: TouchEvent) {
      if (contains(element, event.target as HTMLElement | null)) {
        event.preventDefault();
      }
    }

    element.addEventListener('touchmove', preventDefaultTouchStart, { passive: false });
    onCleanup(() => {
      element.removeEventListener('touchmove', preventDefaultTouchStart);
    });
  });

  // macOS Safari needs some time to pass after the status node has been
  // created before changing its text content to reliably announce its content.
  const screenReaderTimeout = useTimeout();
  onMount(() => {
    screenReaderTimeout.start(50, () => setRenderScreenReaderContent(true));
  });

  function getDragStyles() {
    if (
      !isSwiping() &&
      dragOffset().x === initialTransform().x &&
      dragOffset().y === initialTransform().y &&
      !dragDismissed()
    ) {
      return {
        [ToastRootCssVars.swipeMovementX]: '0px',
        [ToastRootCssVars.swipeMovementY]: '0px',
      };
    }

    const deltaX = dragOffset().x - initialTransform().x;
    const deltaY = dragOffset().y - initialTransform().y;

    return {
      transition: isSwiping() ? 'none' : undefined,
      [ToastRootCssVars.swipeMovementX]: `${deltaX}px`,
      [ToastRootCssVars.swipeMovementY]: `${deltaY}px`,
    };
  }

  const props = createMemo<ComponentProps<'div'>>(() => {
    return {
      role: toast().priority === 'high' ? 'alertdialog' : 'dialog',
      tabIndex: 0,
      'aria-modal': false,
      'aria-labelledby': titleId(),
      'aria-describedby': descriptionId(),
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onKeyDown: handleKeyDown,
      onMouseEnter: () => {
        toastRefs.viewportRef?.dispatchEvent(new Event('mouseenter'));
      },
      onMouseLeave: () => {
        toastRefs.viewportRef?.dispatchEvent(new Event('mouseleave'));
      },
      inert: inertValue(toast().limited),
      style: {
        ...getDragStyles(),
        [ToastRootCssVars.index]:
          toast().transitionStatus === 'ending' ? domIndex() : visibleIndex(),
        [ToastRootCssVars.offsetY]: `${offsetY()}px`,
      },
    };
  });

  const toastRoot: ToastRootContext = {
    refs,
    renderScreenReaderContent,
    toast,
    titleId,
    descriptionId,
    swiping: isSwiping,
    swipeDirection: currentSwipeDirection,
    codependentRefs,
    setCodependentRefs,
  };

  const state = createMemo<ToastRoot.State>(() => ({
    transitionStatus: toast().transitionStatus,
    expanded: hovering() || focused() || hasDifferingHeights(),
    limited: toast().limited || false,
    type: toast().type,
    swiping: toastRoot.swiping(),
    swipeDirection: toastRoot.swipeDirection(),
  }));

  createEffect(
    on(
      [() => toastRoot.codependentRefs.title, () => toastRoot.codependentRefs.description],
      ([title, description]) => {
        if (title) {
          setTitleId(title.explicitId());
        }
        if (description) {
          setDescriptionId(description.explicitId());
        }

        onCleanup(() => {
          setTitleId(undefined);
          setDescriptionId(undefined);
        });
      },
    ),
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      toastRoot.refs.rootRef = el;
    },
    props: [props, elementProps],
    customStyleHookMapping,
    children: () => (
      <>
        {componentProps.children}
        {!focused() && (
          <div
            style={visuallyHidden}
            {...(toast().priority === 'high'
              ? { role: 'alert', 'aria-atomic': true }
              : { role: 'status', 'aria-live': 'polite' })}
          >
            {toastRoot.renderScreenReaderContent() && (
              <>
                {toast().title && <div>{toast().title}</div>}
                {toast().description && <div>{toast().description}</div>}
              </>
            )}
          </div>
        )}
      </>
    ),
  });

  return <ToastRootContext.Provider value={toastRoot}>{element()}</ToastRootContext.Provider>;
}

export namespace ToastRoot {
  export type ToastObject<Data extends object = any> = ToastObjectType<Data>;

  export interface State {
    transitionStatus: TransitionStatus;
    /**
     * Whether the toasts in the viewport are expanded.
     */
    expanded: boolean;
    /**
     * Whether the toast was removed due to exceeding the limit.
     */
    limited: boolean;
    /**
     * The type of the toast.
     */
    type: string | undefined;
    /**
     * Whether the toast is being swiped.
     */
    swiping: boolean;
    /**
     * The direction the toast is being swiped.
     */
    swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The toast to render.
     */
    toast: MaybeAccessor<ToastObject<any>>;
    /**
     * Direction(s) in which the toast can be swiped to dismiss.
     * @default ['down', 'right']
     */
    swipeDirection?: MaybeAccessor<
      'up' | 'down' | 'left' | 'right' | ('up' | 'down' | 'left' | 'right')[] | undefined
    >;
  }
}
