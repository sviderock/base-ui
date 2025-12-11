'use client';
import { createEffect, createMemo, onCleanup, type JSX } from 'solid-js';
import { FloatingFocusManager } from '../../floating-ui-solid';
import { splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { DISABLED_TRANSITIONS_STYLE } from '../../utils/constants';
import { isWebKit } from '../../utils/detectBrowser';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { isMouseWithinBounds } from '../../utils/isMouseWithinBounds';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { styleDisableScrollbar } from '../../utils/styles';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import type { Side } from '../../utils/useAnchorPositioning';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useSelectRootContext } from '../root/SelectRootContext';
import { clearPositionerStyles } from './utils';

const customStyleHookMapping: CustomStyleHookMapping<SelectPopup.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectPopup(componentProps: SelectPopup.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { store, setStore, refs, onOpenChangeComplete, setOpen, highlightTimeout } =
    useSelectRootContext();
  const { side, align, context, alignItemWithTriggerActive, setControlledAlignItemWithTrigger } =
    useSelectPositionerContext();

  useOpenChangeComplete({
    open: () => store.open,
    ref: () => refs.popupRef,
    onComplete() {
      if (store.open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const state = createMemo<SelectPopup.State>(() => ({
    open: store.open,
    transitionStatus: store.transitionStatus,
    side: side(),
    align: align(),
  }));

  let initialHeightRef = 0;
  let reachedMaxHeightRef = false;
  let maxHeightRef = 0;
  let initialPlacedRef = false;
  let originalPositionerStylesRef: JSX.CSSProperties = {};

  const handleScrollArrowVisibility = () => {
    if (!alignItemWithTriggerActive() || !refs.popupRef) {
      return;
    }

    const isScrolledToTop = refs.popupRef.scrollTop < 1;
    const isScrolledToBottom =
      refs.popupRef.scrollTop + refs.popupRef.clientHeight >= refs.popupRef.scrollHeight - 1;

    if (store.scrollUpArrowVisible !== !isScrolledToTop) {
      setStore('scrollUpArrowVisible', !isScrolledToTop);
    }
    if (store.scrollDownArrowVisible !== !isScrolledToBottom) {
      setStore('scrollDownArrowVisible', !isScrolledToBottom);
    }
  };

  createEffect(() => {
    if (!store.positionerElement || Object.keys(originalPositionerStylesRef).length) {
      return;
    }

    originalPositionerStylesRef = {
      top: store.positionerElement.style.top || '0',
      left: store.positionerElement.style.left || '0',
      right: store.positionerElement.style.right,
      height: store.positionerElement.style.height,
      bottom: store.positionerElement.style.bottom,
      'min-height': store.positionerElement.style.minHeight,
      'max-height': store.positionerElement.style.maxHeight,
      'margin-top': store.positionerElement.style.marginTop,
      'margin-bottom': store.positionerElement.style.marginBottom,
    };
  });

  createEffect(() => {
    if (store.mounted || alignItemWithTriggerActive()) {
      return;
    }

    initialPlacedRef = false;
    reachedMaxHeightRef = false;
    initialHeightRef = 0;
    maxHeightRef = 0;

    if (store.positionerElement) {
      clearPositionerStyles(store.positionerElement, originalPositionerStylesRef);
    }
  });

  createEffect(() => {
    const popupElement = refs.popupRef;
    const positionerElement = store.positionerElement;
    const triggerElement = store.triggerElement;

    if (
      !store.mounted ||
      !alignItemWithTriggerActive() ||
      !triggerElement ||
      !positionerElement ||
      !refs.popupRef ||
      !popupElement
    ) {
      return;
    }

    // Wait for `selectedItemTextRef.current` to be set.
    queueMicrotask(() => {
      const positionerStyles = getComputedStyle(positionerElement);
      const popupStyles = getComputedStyle(popupElement);

      const doc = ownerDocument(triggerElement);
      const win = ownerWindow(positionerElement);
      const triggerRect = triggerElement.getBoundingClientRect();
      const positionerRect = positionerElement.getBoundingClientRect();
      const triggerX = triggerRect.left;
      const triggerHeight = triggerRect.height;
      const scrollHeight = popupElement.scrollHeight;

      const borderBottom = parseFloat(popupStyles.borderBottomWidth);
      const marginTop = parseFloat(positionerStyles.marginTop) || 10;
      const marginBottom = parseFloat(positionerStyles.marginBottom) || 10;
      const minHeight = parseFloat(positionerStyles.minHeight) || 100;

      const paddingLeft = 5;
      const paddingRight = 5;
      const triggerCollisionThreshold = 20;

      const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;
      const viewportWidth = doc.documentElement.clientWidth;
      const availableSpaceBeneathTrigger = viewportHeight - triggerRect.bottom + triggerHeight;

      const textElement = refs.selectedItemTextRef;
      const valueElement = refs.valueRef;
      let offsetX = 0;
      let offsetY = 0;

      if (textElement && valueElement) {
        const valueRect = valueElement.getBoundingClientRect();
        const textRect = textElement.getBoundingClientRect();
        const valueLeftFromTriggerLeft = valueRect.left - triggerX;
        const textLeftFromPositionerLeft = textRect.left - positionerRect.left;
        const valueCenterFromPositionerTop = valueRect.top - triggerRect.top + valueRect.height / 2;
        const textCenterFromTriggerTop = textRect.top - positionerRect.top + textRect.height / 2;

        offsetX = valueLeftFromTriggerLeft - textLeftFromPositionerLeft;
        offsetY = textCenterFromTriggerTop - valueCenterFromPositionerTop;
      }

      const idealHeight = availableSpaceBeneathTrigger + offsetY + marginBottom + borderBottom;
      let height = Math.min(viewportHeight, idealHeight);
      const maxHeight = viewportHeight - marginTop - marginBottom;
      const scrollTop = idealHeight - height;

      const left = Math.max(paddingLeft, triggerX + offsetX);
      const maxRight = viewportWidth - paddingRight;
      const rightOverflow = Math.max(0, left + positionerRect.width - maxRight);

      positionerElement.style.left = `${left - rightOverflow}px`;
      positionerElement.style.height = `${height}px`;
      positionerElement.style.maxHeight = 'auto';
      positionerElement.style.marginTop = `${marginTop}px`;
      positionerElement.style.marginBottom = `${marginBottom}px`;

      const maxScrollTop = popupElement.scrollHeight - popupElement.clientHeight;
      const isTopPositioned = scrollTop >= maxScrollTop;

      if (isTopPositioned) {
        height = Math.min(viewportHeight, positionerRect.height) - (scrollTop - maxScrollTop);
      }

      // When the trigger is too close to the top or bottom of the viewport, or the minHeight is
      // reached, we fallback to aligning the popup to the trigger as the UX is poor otherwise.
      const fallbackToAlignPopupToTrigger =
        triggerRect.top < triggerCollisionThreshold ||
        triggerRect.bottom > viewportHeight - triggerCollisionThreshold ||
        height < Math.min(scrollHeight, minHeight);

      // Safari doesn't position the popup correctly when pinch-zoomed.
      const isPinchZoomed = (win.visualViewport?.scale ?? 1) !== 1 && isWebKit;

      if (fallbackToAlignPopupToTrigger || isPinchZoomed) {
        initialPlacedRef = true;
        clearPositionerStyles(positionerElement, originalPositionerStylesRef);
        setControlledAlignItemWithTrigger(false);
        return;
      }

      if (isTopPositioned) {
        const topOffset = Math.max(0, viewportHeight - idealHeight);
        positionerElement.style.top = positionerRect.height >= maxHeight ? '0' : `${topOffset}px`;
        positionerElement.style.height = `${height}px`;
        popupElement.scrollTop = popupElement.scrollHeight - popupElement.clientHeight;
        initialHeightRef = Math.max(minHeight, height);
      } else {
        positionerElement.style.bottom = '0';
        initialHeightRef = Math.max(minHeight, height);
        popupElement.scrollTop = scrollTop;
      }

      if (initialHeightRef === viewportHeight) {
        reachedMaxHeightRef = true;
      }

      handleScrollArrowVisibility();

      // Avoid the `onScroll` event logic from triggering before the popup is placed.
      setTimeout(() => {
        initialPlacedRef = true;
      });
    });
  });

  createEffect(() => {
    if (!alignItemWithTriggerActive() || !store.positionerElement || !store.mounted) {
      return;
    }

    const win = ownerWindow(store.positionerElement);

    function handleResize(event: Event) {
      setOpen(false, event, 'window-resize');
    }

    win.addEventListener('resize', handleResize);

    onCleanup(() => {
      win.removeEventListener('resize', handleResize);
    });
  });

  const defaultProps = createMemo<HTMLProps>(() => ({
    onKeyDown() {
      refs.keyboardActiveRef = true;
    },
    onMouseMove() {
      refs.keyboardActiveRef = false;
    },
    onMouseLeave(event) {
      if (isMouseWithinBounds(event)) {
        return;
      }

      const popup = event.currentTarget;

      highlightTimeout.start(0, () => {
        setStore('activeIndex', null);
        popup.focus({ preventScroll: true });
      });
    },
    onScroll(event) {
      if (
        !alignItemWithTriggerActive() ||
        !store.positionerElement ||
        !refs.popupRef ||
        !initialPlacedRef
      ) {
        return;
      }

      if (reachedMaxHeightRef || !alignItemWithTriggerActive()) {
        handleScrollArrowVisibility();
        return;
      }

      const isTopPositioned = store.positionerElement.style.top === '0px';
      const isBottomPositioned = store.positionerElement.style.bottom === '0px';
      const currentHeight = store.positionerElement.getBoundingClientRect().height;
      const doc = ownerDocument(store.positionerElement);
      const positionerStyles = getComputedStyle(store.positionerElement);
      const marginTop = parseFloat(positionerStyles.marginTop);
      const marginBottom = parseFloat(positionerStyles.marginBottom);
      const viewportHeight = doc.documentElement.clientHeight - marginTop - marginBottom;

      if (isTopPositioned) {
        const scrollTop = event.currentTarget.scrollTop;
        const maxScrollTop = event.currentTarget.scrollHeight - event.currentTarget.clientHeight;
        const diff = maxScrollTop - scrollTop;
        const nextHeight = Math.min(currentHeight + diff, viewportHeight);
        store.positionerElement.style.height = `${Math.min(currentHeight + diff, viewportHeight)}px`;

        if (nextHeight !== viewportHeight) {
          event.currentTarget.scrollTop = maxScrollTop;
        } else {
          reachedMaxHeightRef = true;
        }
      } else if (isBottomPositioned) {
        const scrollTop = event.currentTarget.scrollTop;
        const minScrollTop = 0;
        const diff = scrollTop - minScrollTop;
        const nextHeight = Math.min(currentHeight + diff, viewportHeight);
        const idealHeight = currentHeight + diff;
        const overshoot = idealHeight - viewportHeight;
        store.positionerElement.style.height = `${Math.min(idealHeight, viewportHeight)}px`;

        if (nextHeight !== viewportHeight) {
          event.currentTarget.scrollTop = 0;
        } else {
          reachedMaxHeightRef = true;
          if (
            event.currentTarget.scrollTop <
            event.currentTarget.scrollHeight - event.currentTarget.clientHeight
          ) {
            event.currentTarget.scrollTop -= diff - overshoot;
          }
        }
      }

      handleScrollArrowVisibility();
    },
    ...(alignItemWithTriggerActive() && {
      style: {
        position: 'relative',
        'max-height': '100%',
        'overflow-x': 'hidden',
        'overflow-y': 'auto',
      },
    }),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      refs.popupRef = el;
    },
    customStyleHookMapping,
    props: [
      store.popupProps,
      defaultProps,
      () => ({
        style: store.transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE.style : undefined,
        class: alignItemWithTriggerActive() ? styleDisableScrollbar.class : undefined,
      }),
      elementProps,
    ],
  });

  return (
    <>
      {styleDisableScrollbar.element}
      <FloatingFocusManager context={context} modal={false} disabled={!store.mounted} restoreFocus>
        {element()}
      </FloatingFocusManager>
    </>
  );
}

export namespace SelectPopup {
  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
    children?: JSX.Element;
    /**
     * @ignore
     */
    id?: MaybeAccessor<string | undefined>;
  }

  export interface State {
    side: Side | 'none';
    align: 'start' | 'end' | 'center';
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
