'use client';
import { createMemo, type Accessor } from 'solid-js';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { useAnimationFrame } from '../../utils/useAnimationFrame';
import type { ElementProps, FloatingRootContext } from '../types';
import { isMouseLikePointerType } from '../utils';

export interface UseClickProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean>;
  /**
   * The type of event to use to determine a “click” with mouse input.
   * Keyboard clicks work as normal.
   * @default 'click'
   */
  event?: MaybeAccessor<'click' | 'mousedown'>;
  /**
   * Whether to toggle the open state with repeated clicks.
   * @default true
   */
  toggle?: MaybeAccessor<boolean>;
  /**
   * Whether to ignore the logic for mouse input (for example, if `useHover()`
   * is also being used).
   * @default false
   */
  ignoreMouse?: MaybeAccessor<boolean>;
  /**
   * If already open from another event such as the `useHover()` Hook,
   * determines whether to keep the floating element open when clicking the
   * reference element for the first time.
   * @default true
   */
  stickIfOpen?: MaybeAccessor<boolean>;
}

/**
 * Opens or closes the floating element when clicking the reference element.
 * @see https://floating-ui.com/docs/useClick
 */
export function useClick(
  context: FloatingRootContext,
  props: UseClickProps = {},
): Accessor<ElementProps> {
  const enabled = () => access(props.enabled) ?? true;
  const eventOption = () => access(props.event) ?? 'click';
  const toggle = () => access(props.toggle) ?? true;
  const ignoreMouse = () => access(props.ignoreMouse) ?? false;
  const stickIfOpen = () => access(props.stickIfOpen) ?? true;

  let pointerTypeRef: 'mouse' | 'pen' | 'touch' | undefined | ({} & string);
  const frame = useAnimationFrame();
  // const [isInside, setIsInside] = createSignal(false);

  const reference = createMemo<ElementProps['reference']>(() => {
    return {
      onPointerDown: (event) => {
        pointerTypeRef = event.pointerType;
      },
      onMouseDown: (event) => {
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
      onClick: (event) => {
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
      onKeyDown: () => {
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
