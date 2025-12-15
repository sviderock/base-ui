'use client';
import { onCleanup, onMount } from 'solid-js';
import { contains, getTarget, stopEvent } from '../../floating-ui-solid/utils';
import { splitComponentProps } from '../../solid-helpers';
import { ownerDocument } from '../../utils/owner';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';

const LONG_PRESS_DELAY = 500;

/**
 * An area that opens the menu on right click or long press.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export function ContextMenuTrigger(componentProps: ContextMenuTrigger.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { anchor, refs } = useContextMenuRootContext(false);

  let triggerRef = null as HTMLDivElement | null | undefined;
  let touchPositionRef = null as { x: number; y: number } | null;
  let allowMouseUpRef = false;
  const longPressTimeout = useTimeout();
  const allowMouseUpTimeout = useTimeout();

  const handleLongPress = (x: number, y: number, event: Event) => {
    const isTouchEvent = event.type.startsWith('touch');

    anchor.getBoundingClientRect = () => {
      return DOMRect.fromRect({
        width: isTouchEvent ? 10 : 0,
        height: isTouchEvent ? 10 : 0,
        x,
        y,
      });
    };

    allowMouseUpRef = false;
    refs.actionsRef?.setOpen(true, event);

    allowMouseUpTimeout.start(LONG_PRESS_DELAY, () => {
      allowMouseUpRef = true;
    });
  };

  const handleContextMenu = (event: MouseEvent) => {
    refs.allowMouseUpTriggerRef = true;
    stopEvent(event);
    handleLongPress(event.clientX, event.clientY, event);
    const doc = ownerDocument(triggerRef);

    doc.addEventListener(
      'mouseup',
      (mouseEvent: MouseEvent) => {
        refs.allowMouseUpTriggerRef = false;

        if (!allowMouseUpRef) {
          return;
        }

        allowMouseUpTimeout.clear();
        allowMouseUpRef = false;

        if (contains(refs.positionerRef, getTarget(mouseEvent) as Element | null)) {
          return;
        }

        refs.actionsRef?.setOpen(false, mouseEvent, 'cancel-open');
      },
      { once: true },
    );
  };

  const handleTouchStart = (event: TouchEvent) => {
    refs.allowMouseUpTriggerRef = false;
    if (event.touches.length === 1) {
      event.stopPropagation();
      const touch = event.touches[0];
      touchPositionRef = { x: touch.clientX, y: touch.clientY };
      longPressTimeout.start(LONG_PRESS_DELAY, () => {
        if (touchPositionRef) {
          handleLongPress(touchPositionRef.x, touchPositionRef.y, event);
        }
      });
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (longPressTimeout.isStarted() && touchPositionRef && event.touches.length === 1) {
      const touch = event.touches[0];
      const moveThreshold = 10;

      const deltaX = Math.abs(touch.clientX - touchPositionRef.x);
      const deltaY = Math.abs(touch.clientY - touchPositionRef.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        longPressTimeout.clear();
      }
    }
  };

  const handleTouchEnd = () => {
    longPressTimeout.clear();
    touchPositionRef = null;
  };

  function handleDocumentContextMenu(event: MouseEvent) {
    const target = getTarget(event);
    const targetElement = target as HTMLElement | null;
    if (
      contains(triggerRef, targetElement) ||
      contains(refs.internalBackdropRef, targetElement) ||
      contains(refs.backdropRef, targetElement)
    ) {
      event.preventDefault();
    }
  }

  onMount(() => {
    const doc = ownerDocument(triggerRef);
    doc.addEventListener('contextmenu', handleDocumentContextMenu);
    onCleanup(() => {
      doc.removeEventListener('contextmenu', handleDocumentContextMenu);
    });
  });

  const element = useRenderElement('div', componentProps, {
    ref: (el) => {
      triggerRef = el;
    },
    props: [
      {
        onContextMenu: handleContextMenu,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchEnd,
        style: {
          '-webkit-touch-callout': 'none',
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace ContextMenuTrigger {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
