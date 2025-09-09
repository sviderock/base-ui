'use client';
import { screen } from '@solidjs/testing-library';
import { createMemo, createSignal, onMount, type Accessor } from 'solid-js';
import { useAnimationFrame } from '../../utils/useAnimationFrame';
import type { ElementProps, FloatingRootContext } from '../types';
import { isMouseLikePointerType } from '../utils';

export interface UseClickProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: Accessor<boolean>;
  /**
   * The type of event to use to determine a “click” with mouse input.
   * Keyboard clicks work as normal.
   * @default 'click'
   */
  event?: Accessor<'click' | 'mousedown'>;
  /**
   * Whether to toggle the open state with repeated clicks.
   * @default true
   */
  toggle?: Accessor<boolean>;
  /**
   * Whether to ignore the logic for mouse input (for example, if `useHover()`
   * is also being used).
   * @default false
   */
  ignoreMouse?: Accessor<boolean>;
  /**
   * If already open from another event such as the `useHover()` Hook,
   * determines whether to keep the floating element open when clicking the
   * reference element for the first time.
   * @default true
   */
  stickIfOpen?: Accessor<boolean>;
}

/**
 * Opens or closes the floating element when clicking the reference element.
 * @see https://floating-ui.com/docs/useClick
 */
export function useClick(
  context: FloatingRootContext,
  props: UseClickProps = {},
): Accessor<ElementProps> {
  const enabled = () => props.enabled?.() ?? true;
  const eventOption = () => props.event?.() ?? 'click';
  const toggle = () => props.toggle?.() ?? true;
  const ignoreMouse = () => props.ignoreMouse?.() ?? false;
  const stickIfOpen = () => props.stickIfOpen?.() ?? true;

  let pointerTypeRef: 'mouse' | 'pen' | 'touch' | undefined | ({} & string);
  const frame = useAnimationFrame();
  // const [isInside, setIsInside] = createSignal(false);

  const reference = createMemo<ElementProps['reference']>(() => {
    return {
      'on:pointerdown': (event) => {
        pointerTypeRef = event.pointerType;
      },
      'on:mousedown': (event) => {
        const pointerType = pointerTypeRef;

        // Ignore all buttons except for the "main" button.
        // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
        if (
          event.button !== 0 ||
          eventOption() === 'click' ||
          (isMouseLikePointerType(pointerType, true) && ignoreMouse())
        ) {
          return;
        }

        const openEvent = context.dataRef.openEvent;
        const openEventType = openEvent?.type;
        const nextOpen = !(
          context.open() &&
          toggle() &&
          (openEvent && stickIfOpen()
            ? openEventType === 'click' || openEventType === 'mousedown'
            : true)
        );
        // Wait until focus is set on the element. This is an alternative to
        // `event.preventDefault()` to avoid :focus-visible from appearing when using a pointer.

        frame.request(() => {
          context.onOpenChange(nextOpen, event, 'click');
        });
      },
      'on:click': (event) => {
        const pointerType = pointerTypeRef;

        if (eventOption() === 'mousedown' && pointerType) {
          pointerTypeRef = undefined;
          return;
        }

        if (isMouseLikePointerType(pointerType, true) && ignoreMouse()) {
          return;
        }

        const openEvent = context.dataRef.openEvent;
        const openEventType = openEvent?.type;
        const nextOpen = !(
          context.open() &&
          toggle() &&
          (openEvent && stickIfOpen()
            ? openEventType === 'click' ||
              openEventType === 'mousedown' ||
              openEventType === 'keydown' ||
              openEventType === 'keyup'
            : true)
        );
        context.onOpenChange(nextOpen, event, 'click');
      },
      'on:keydown': () => {
        pointerTypeRef = undefined;
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
