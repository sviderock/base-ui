'use client';
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Accessor,
} from 'solid-js';
import { CompositeItem } from '../../composite/item/CompositeItem';
import {
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useFloatingTree,
  useHover,
  useInteractions,
} from '../../floating-ui-solid';
import {
  contains,
  disableFocusInside,
  enableFocusInside,
  getNextTabbable,
  getPreviousTabbable,
  getTarget,
  isOutsideEvent,
  stopEvent,
} from '../../floating-ui-solid/utils';
import { splitComponentProps } from '../../solid-helpers';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { FocusGuard } from '../../utils/FocusGuard';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import {
  BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import type { BaseUIComponentProps } from '../../utils/types';
import { useAnimationFrame } from '../../utils/useAnimationFrame';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { RenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import { NavigationMenuPopupCssVars } from '../popup/NavigationMenuPopupCssVars';
import { NavigationMenuPositionerCssVars } from '../positioner/NavigationMenuPositionerCssVars';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';

const TRIGGER_IDENTIFIER = 'data-navigation-menu-trigger';

/**
 * Opens the navigation menu popup when hovered or clicked, revealing the
 * associated content.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuTrigger(componentProps: NavigationMenuTrigger.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const {
    value,
    setValue,
    mounted,
    open,
    positionerElement,
    setActivationDirection,
    setFloatingRootContext,
    popupElement,
    delay,
    closeDelay,
    orientation,
    refs,
  } = useNavigationMenuRootContext();
  const {
    value: itemValue,
    isActive: isActiveItem,
    transitionStatus,
  } = useNavigationMenuItemContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();

  const stickIfOpenTimeout = useTimeout();
  const focusFrame = useAnimationFrame();
  const sizeFrame1 = useAnimationFrame();
  const sizeFrame2 = useAnimationFrame();

  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | null | undefined>(null);
  const [stickIfOpen, setStickIfOpen] = createSignal(true);
  const [pointerType, setPointerType] = createSignal<'mouse' | 'touch' | 'pen' | ''>('');

  const isActiveItemRef = isActiveItem();

  let allowFocusRef = false;

  const handleValueChange = (currentWidth: number, currentHeight: number) => {
    const popupEl = popupElement();
    const positionerEl = positionerElement();
    if (!popupEl || !positionerEl) {
      return;
    }

    popupEl.style.removeProperty(NavigationMenuPopupCssVars.popupWidth);
    popupEl.style.removeProperty(NavigationMenuPopupCssVars.popupHeight);
    positionerEl.style.removeProperty(NavigationMenuPositionerCssVars.positionerWidth);
    positionerEl.style.removeProperty(NavigationMenuPositionerCssVars.positionerHeight);

    const nextWidth = popupEl.offsetWidth;
    const nextHeight = popupEl.offsetHeight;

    if (currentHeight === 0 || currentWidth === 0) {
      currentWidth = nextWidth;
      currentHeight = nextHeight;
    }

    popupEl.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${currentWidth}px`);
    popupEl.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${currentHeight}px`);
    positionerEl.style.setProperty(
      NavigationMenuPositionerCssVars.positionerWidth,
      `${nextWidth}px`,
    );
    positionerEl.style.setProperty(
      NavigationMenuPositionerCssVars.positionerHeight,
      `${nextHeight}px`,
    );

    sizeFrame1.request(() => {
      sizeFrame2.request(() => {
        popupEl.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${nextWidth}px`);
        popupEl.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${nextHeight}px`);
      });
    });
  };

  const setAutoSizes = () => {
    const popupEl = popupElement();
    if (!popupEl) {
      return;
    }

    popupEl.style.setProperty(NavigationMenuPopupCssVars.popupWidth, 'auto');
    popupEl.style.setProperty(NavigationMenuPopupCssVars.popupHeight, 'auto');
  };

  const runOnceAnimationsFinish = useAnimationsFinished(popupElement, value);

  createEffect(() => {
    if (!positionerElement() || !popupElement() || !open()) {
      return;
    }

    sizeFrame1.request(() => {
      sizeFrame2.request(setAutoSizes);
    });
    onCleanup(() => {
      sizeFrame1.cancel();
      sizeFrame2.cancel();
    });
  });

  createEffect(() => {
    if (!positionerElement() || !popupElement() || !value()) {
      return;
    }

    const ac = new AbortController();
    sizeFrame1.request(() => {
      sizeFrame2.request(() => {
        runOnceAnimationsFinish(setAutoSizes, ac.signal);
      });
    });

    onCleanup(() => {
      sizeFrame1.cancel();
      sizeFrame2.cancel();
      ac.abort();
    });
  });

  createEffect(() => {
    if (!open()) {
      setPointerType('');
      stickIfOpenTimeout.clear();
      sizeFrame1.cancel();
      sizeFrame2.cancel();
    }
  });

  createEffect(() => {
    if (isActiveItemRef && open() && popupElement()) {
      handleValueChange(0, 0);
    }
  });

  createEffect(() => {
    if (isActiveItem() && open() && popupElement() && allowFocusRef) {
      allowFocusRef = false;
      focusFrame.request(() => {
        refs.beforeOutsideRef?.focus();
      });
    }

    onCleanup(() => {
      focusFrame.cancel();
    });
  });

  function handleOpenChange(
    nextOpen: boolean,
    event: Event | undefined,
    reason: BaseOpenChangeReason | undefined,
  ) {
    const isHover = reason === 'trigger-hover';

    if (pointerType() === 'touch' && isHover) {
      return;
    }

    if (!nextOpen && value() !== itemValue()) {
      return;
    }

    const popupEl = popupElement();
    const positionerEl = positionerElement();
    if (!nextOpen && popupEl && positionerEl) {
      popupEl.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${popupEl.offsetWidth}px`);
      popupEl.style.setProperty(
        NavigationMenuPopupCssVars.popupHeight,
        `${popupEl.offsetHeight}px`,
      );
      positionerEl.style.setProperty(
        NavigationMenuPositionerCssVars.positionerWidth,
        `${positionerEl.offsetWidth}px`,
      );
      positionerEl.style.setProperty(
        NavigationMenuPositionerCssVars.positionerHeight,
        `${positionerEl.offsetHeight}px`,
      );
    }

    function changeState() {
      if (isHover) {
        // Only allow "patient" clicks to close the popup if it's open.
        // If they clicked within 500ms of the popup opening, keep it open.
        setStickIfOpen(true);
        stickIfOpenTimeout.clear();
        stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
          setStickIfOpen(false);
        });
      }

      if (nextOpen) {
        setValue(itemValue(), event, reason);
      } else {
        setValue(null, event, reason);
      }
    }

    changeState();
  }

  const context = useFloatingRootContext({
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      handleOpenChange(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const hover = useHover(context, {
    move: false,
    handleClose: (ctx) => safePolygon({ blockPointerEvents: pointerType() !== 'touch' })(ctx),
    restMs: () => (mounted() ? 0 : delay()),
    delay: () => ({ close: closeDelay() }),
  });
  const click = useClick(context, {
    stickIfOpen,
    toggle: () => isActiveItem() && transitionStatus() === undefined,
  });
  const dismiss = useDismiss(context, {
    enabled: isActiveItem,
    outsidePress(event) {
      // When pressing a new trigger with touch input, prevent closing the popup.
      const target = getTarget(event) as HTMLElement | null;
      const closestNavigationMenuTrigger = target?.closest(`[${TRIGGER_IDENTIFIER}]`);
      return closestNavigationMenuTrigger === null;
    },
  });

  createEffect(() => {
    if (isActiveItem()) {
      setFloatingRootContext(context);
      refs.prevTriggerElementRef = triggerElement();
    }
  });

  const { getReferenceProps } = useInteractions([hover, click, dismiss]);

  const handleOpenEvent = (event: MouseEvent | KeyboardEvent) => {
    const popupEl = popupElement();
    const positionerEl = positionerElement();
    if (!popupEl || !positionerEl) {
      return;
    }

    const currentWidth = popupEl.offsetWidth;
    const currentHeight = popupEl.offsetHeight;
    const triggerEl = triggerElement();

    batch(() => {
      const prevTriggerRect = refs.prevTriggerElementRef?.getBoundingClientRect();

      if (mounted() && prevTriggerRect && triggerEl) {
        const nextTriggerRect = triggerEl.getBoundingClientRect();
        const isMovingRight = nextTriggerRect.left > prevTriggerRect.left;
        const isMovingDown = nextTriggerRect.top > prevTriggerRect.top;

        if (orientation() === 'horizontal' && nextTriggerRect.left !== prevTriggerRect.left) {
          setActivationDirection(isMovingRight ? 'right' : 'left');
        } else if (orientation() === 'vertical' && nextTriggerRect.top !== prevTriggerRect.top) {
          setActivationDirection(isMovingDown ? 'down' : 'up');
        }
      }

      // Reset the `openEvent` to `undefined` when the active item changes so that a
      // `click` -> `hover` move to new trigger -> `hover` move back doesn't unepxpectedly
      // cause the popup to remain stuck open.
      if (event.type !== 'click') {
        context.dataRef.openEvent = undefined;
      }

      if (pointerType() === 'touch' && event.type !== 'click') {
        return;
      }

      if (value() != null) {
        setValue(
          itemValue(),
          event,
          event.type === 'mouseenter' ? 'trigger-hover' : 'trigger-press',
        );
      }
    });

    handleValueChange(currentWidth, currentHeight);
  };

  const state: NavigationMenuTrigger.State = {
    open: isActiveItem,
  };

  function handleSetPointerType(event: PointerEvent) {
    setPointerType(event.pointerType as 'mouse' | 'touch' | 'pen' | '');
  }

  return (
    <>
      <CompositeItem
        render={(p) => (
          <RenderElement
            element="button"
            componentProps={componentProps}
            ref={(el) => {
              p().ref(el);
              setTriggerElement(el);
              if (typeof componentProps.ref === 'function') {
                componentProps.ref(el);
              } else {
                componentProps.ref = el;
              }
            }}
            params={{
              state,
              customStyleHookMapping: pressableTriggerOpenStateMapping,
              props: [
                p(),
                getReferenceProps,
                {
                  tabIndex: 0,
                  onMouseEnter: handleOpenEvent,
                  onClick: handleOpenEvent,
                  onPointerEnter: handleSetPointerType,
                  onPointerDown: handleSetPointerType,
                  'aria-expanded': isActiveItem(),
                  'aria-controls': isActiveItem() ? popupElement()?.id : undefined,
                  [TRIGGER_IDENTIFIER as string]: '',
                  onMouseMove() {
                    allowFocusRef = false;
                  },
                  onKeyDown(event) {
                    allowFocusRef = true;
                    const openHorizontal =
                      orientation() === 'horizontal' && event.key === 'ArrowDown';
                    const openVertical = orientation() === 'vertical' && event.key === 'ArrowRight';

                    if (openHorizontal || openVertical) {
                      setValue(itemValue(), event, 'list-navigation');
                      handleOpenEvent(event);
                      stopEvent(event);
                    }
                  },
                  onBlur(event) {
                    if (
                      event.relatedTarget &&
                      isOutsideMenuEvent(
                        {
                          currentTarget: event.currentTarget,
                          relatedTarget: event.relatedTarget as HTMLElement | null,
                        },
                        {
                          popupElement: popupElement(),
                          rootRef: refs.rootRef,
                          tree,
                          virtualFloatingTree: context.dataRef.virtualFloatingTree,
                          nodeId: nodeId?.(),
                        },
                      )
                    ) {
                      setValue(null, event, 'focus-out');
                    }
                  },
                },
                elementProps,
              ],
            }}
          />
        )}
      />

      {isActiveItem() && (
        <>
          <FocusGuard
            ref={(el) => {
              refs.beforeOutsideRef = el;
            }}
            onFocus={(event) => {
              const positionerEl = positionerElement();
              const triggerEl = triggerElement();

              if (positionerEl && isOutsideEvent(event, positionerEl)) {
                queueMicrotask(() => {
                  refs.beforeInsideRef?.focus();
                });
              } else {
                queueMicrotask(() => {
                  const prevTabbable = getPreviousTabbable(triggerEl);
                  prevTabbable?.focus();
                });
              }
            }}
          />
          <span aria-owns={popupElement()?.id} style={visuallyHidden} />
          <FocusGuard
            ref={(el) => {
              refs.afterOutsideRef = el;
            }}
            onFocus={(event) => {
              const positionerEl = positionerElement();
              const triggerEl = triggerElement();
              if (positionerEl && isOutsideEvent(event, positionerEl)) {
                queueMicrotask(() => {
                  refs.afterInsideRef?.focus();
                });
              } else {
                queueMicrotask(() => {
                  const nextTabbable = getNextTabbable(triggerEl);
                  nextTabbable?.focus();

                  if (!contains(refs.rootRef, nextTabbable)) {
                    setValue(null, event, 'focus-out');
                  }
                });
              }
            }}
          />
        </>
      )}
    </>
  );
}

export namespace NavigationMenuTrigger {
  export interface State {
    /**
     * If `true`, the popup is open and the item is active.
     */
    open: Accessor<boolean>;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
