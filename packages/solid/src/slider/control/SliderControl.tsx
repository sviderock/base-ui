'use client';
import { createEffect, onCleanup } from 'solid-js';
import { useDirection } from '../../direction-provider/DirectionContext';
import { activeElement } from '../../floating-ui-solid/utils';
import { splitComponentProps } from '../../solid-helpers';
import { clamp } from '../../utils/clamp';
import { ownerDocument } from '../../utils/owner';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { valueToPercent } from '../../utils/valueToPercent';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';
import { replaceArrayItemAtIndex } from '../utils/replaceArrayItemAtIndex';
import { roundValueToStep } from '../utils/roundValueToStep';
import { validateMinimumDistance } from '../utils/validateMinimumDistance';

const INTENTIONAL_DRAG_COUNT_THRESHOLD = 2;

function getClosestThumbIndex(values: readonly number[], currentValue: number, max: number) {
  let closestIndex;
  let minDistance;
  for (let i = 0; i < values.length; i += 1) {
    const distance = Math.abs(currentValue - values[i]);
    if (
      minDistance === undefined ||
      // when the value is at max, the lowest index thumb has to be dragged
      // first or it will block higher index thumbs from moving
      // otherwise consider higher index thumbs to be closest when their values are identical
      (values[i] === max ? distance < minDistance : distance <= minDistance)
    ) {
      closestIndex = i;
      minDistance = distance;
    }
  }

  return closestIndex;
}

function getControlOffset(styles: CSSStyleDeclaration | null, orientation: Orientation) {
  if (!styles) {
    return {
      start: 0,
      end: 0,
    };
  }

  const start = orientation === 'horizontal' ? 'InlineStart' : 'Top';
  const end = orientation === 'horizontal' ? 'InlineEnd' : 'Bottom';

  return {
    start: parseFloat(styles[`border${start}Width`]) + parseFloat(styles[`padding${start}`]),
    end: parseFloat(styles[`border${end}Width`]) + parseFloat(styles[`padding${end}`]),
  };
}

function getFingerPosition(
  event: TouchEvent | PointerEvent,
  touchIdRef: any,
): FingerPosition | null {
  // The event is TouchEvent
  if (touchIdRef !== undefined && (event as TouchEvent).changedTouches) {
    const touchEvent = event as TouchEvent;
    for (let i = 0; i < touchEvent.changedTouches.length; i += 1) {
      const touch = touchEvent.changedTouches[i];
      if (touch.identifier === touchIdRef) {
        return {
          x: touch.clientX,
          y: touch.clientY,
        };
      }
    }

    return null;
  }

  // The event is PointerEvent
  return {
    x: (event as PointerEvent).clientX,
    y: (event as PointerEvent).clientY,
  };
}

/**
 * The clickable, interactive part of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderControl(componentProps: SliderControl.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const {
    active: activeThumbIndex,
    disabled,
    dragging,
    fieldControlValidation,
    refs,
    max,
    min,
    minStepsBetweenValues,
    onValueCommitted,
    orientation,
    range,
    registerFieldControlRef,
    setActive,
    setDragging,
    setValue,
    state,
    step,
    values,
  } = useSliderRootContext();

  let controlRef = null as HTMLElement | null | undefined;
  let stylesRef = null as CSSStyleDeclaration | null;
  const setStylesRef = (element: HTMLElement | null | undefined) => {
    if (element && stylesRef == null) {
      if (stylesRef == null) {
        stylesRef = getComputedStyle(element);
      }
    }
  };
  let closestThumbIndexRef = null as number | null;
  // A number that uniquely identifies the current finger in the touch session.
  let touchIdRef = null as number | null;
  let moveCountRef = 0;
  /**
   * The difference between the value at the finger origin and the value at
   * the center of the thumb scaled down to fit the range [0, 1]
   */
  let offsetRef = 0;

  const direction = useDirection();

  const getFingerState = (
    fingerPosition: FingerPosition | null,
    /**
     * When `true`, closestThumbIndexRef is updated.
     * It's `true` when called by touchstart or pointerdown.
     */
    shouldCaptureThumbIndex: boolean = false,
    /**
     * The difference between the value at the finger origin and the value at
     * the center of the thumb scaled down to fit the range [0, 1]
     */
    thumbOffset: number = 0,
  ): FingerState | null => {
    if (fingerPosition == null) {
      return null;
    }

    if (!controlRef) {
      return null;
    }

    const isRtl = direction() === 'rtl';
    const isVertical = orientation() === 'vertical';

    const { width, height, bottom, left, right } = controlRef.getBoundingClientRect();

    const controlOffset = getControlOffset(stylesRef, orientation());

    // the value at the finger origin scaled down to fit the range [0, 1]
    let valueRescaled = isVertical
      ? (bottom - controlOffset.end - fingerPosition.y) /
          (height - controlOffset.start - controlOffset.end) +
        thumbOffset
      : (isRtl
          ? right - controlOffset.start - fingerPosition.x
          : fingerPosition.x - left - controlOffset.start) /
          (width - controlOffset.start - controlOffset.end) +
        thumbOffset * (isRtl ? -1 : 1);

    valueRescaled = clamp(valueRescaled, 0, 1);

    let newValue = (max() - min()) * valueRescaled + min();
    newValue = roundValueToStep(newValue, step(), min());
    newValue = clamp(newValue, min(), max());

    if (!range()) {
      return {
        value: newValue,
        valueRescaled,
        thumbIndex: 0,
      };
    }

    if (shouldCaptureThumbIndex) {
      closestThumbIndexRef = getClosestThumbIndex(values(), newValue, max()) ?? 0;
    }

    const closestThumbIndex = closestThumbIndexRef ?? 0;
    const minValueDifference = minStepsBetweenValues() * step();

    // Bound the new value to the thumb's neighbours.
    newValue = clamp(
      newValue,
      values()[closestThumbIndex - 1] + minValueDifference || -Infinity,
      values()[closestThumbIndex + 1] - minValueDifference || Infinity,
    );

    return {
      value: replaceArrayItemAtIndex(values(), closestThumbIndex, newValue),
      valueRescaled,
      thumbIndex: closestThumbIndex,
    };
  };

  const focusThumb = (thumbIndex: number) => {
    if (!controlRef) {
      return;
    }

    const activeEl = activeElement(ownerDocument(controlRef));

    if (activeEl == null || !controlRef.contains(activeEl) || activeThumbIndex() !== thumbIndex) {
      setActive(thumbIndex);
      refs.thumbRefs[thumbIndex]?.querySelector<HTMLInputElement>('input[type="range"]')?.focus();
    }
  };

  const handleTouchMove = (nativeEvent: TouchEvent | PointerEvent) => {
    const fingerPosition = getFingerPosition(nativeEvent, touchIdRef);

    if (fingerPosition == null) {
      return;
    }

    moveCountRef += 1;

    // Cancel move in case some other element consumed a pointerup event and it was not fired.
    // @ts-ignore buttons doesn't not exists on touch event
    if (nativeEvent.type === 'pointermove' && nativeEvent.buttons === 0) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleTouchEnd(nativeEvent);
      return;
    }

    const finger = getFingerState(fingerPosition, false, offsetRef);

    if (finger == null) {
      return;
    }

    focusThumb(finger.thumbIndex);

    if (validateMinimumDistance(finger.value, step(), minStepsBetweenValues())) {
      if (!dragging() && moveCountRef > INTENTIONAL_DRAG_COUNT_THRESHOLD) {
        setDragging(true);
      }

      setValue(finger.value, finger.thumbIndex, nativeEvent);
    }
  };

  const handleTouchEnd = (nativeEvent: TouchEvent | PointerEvent) => {
    const fingerPosition = getFingerPosition(nativeEvent, touchIdRef);
    setDragging(false);

    if (fingerPosition == null) {
      return;
    }

    const finger = getFingerState(fingerPosition, false);

    if (finger == null) {
      return;
    }

    setActive(-1);

    fieldControlValidation.commitValidation(refs.lastChangedValueRef ?? finger.value);
    onValueCommitted(refs.lastChangedValueRef ?? finger.value, nativeEvent);

    if ('pointerType' in nativeEvent && controlRef?.hasPointerCapture(nativeEvent.pointerId)) {
      controlRef?.releasePointerCapture(nativeEvent.pointerId);
    }

    touchIdRef = null;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stopListening();
  };

  const handleTouchStart = (nativeEvent: TouchEvent) => {
    if (disabled()) {
      return;
    }

    const touch = nativeEvent.changedTouches[0];

    if (touch != null) {
      touchIdRef = touch.identifier;
    }

    const fingerPosition = getFingerPosition(nativeEvent, touchIdRef);

    if (fingerPosition != null) {
      const finger = getFingerState(fingerPosition, true);

      if (finger == null) {
        return;
      }

      focusThumb(finger.thumbIndex);
      setValue(finger.value, finger.thumbIndex, nativeEvent);
    }

    moveCountRef = 0;
    const doc = ownerDocument(controlRef);
    doc.addEventListener('touchmove', handleTouchMove, { passive: true });
    doc.addEventListener('touchend', handleTouchEnd, { passive: true });
  };

  const stopListening = () => {
    offsetRef = 0;
    const doc = ownerDocument(controlRef);
    doc.removeEventListener('pointermove', handleTouchMove);
    doc.removeEventListener('pointerup', handleTouchEnd);
    doc.removeEventListener('touchmove', handleTouchMove);
    doc.removeEventListener('touchend', handleTouchEnd);
  };

  createEffect(() => {
    if (!controlRef) {
      onCleanup(() => stopListening());
      return;
    }

    controlRef.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });

    onCleanup(() => {
      controlRef?.removeEventListener('touchstart', handleTouchStart);

      stopListening();
    });
  });

  createEffect(() => {
    if (disabled()) {
      stopListening();
    }
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      registerFieldControlRef(el);
      controlRef = el;
      setStylesRef(el);
    },
    customStyleHookMapping: sliderStyleHookMapping,
    props: [
      {
        onPointerDown(event: PointerEvent) {
          if (disabled()) {
            return;
          }

          if (event.defaultPrevented) {
            return;
          }

          // Only handle left clicks
          if (event.button !== 0) {
            return;
          }

          // Avoid text selection
          event.preventDefault();

          const fingerPosition = getFingerPosition(event, touchIdRef);

          if (fingerPosition != null) {
            const finger = getFingerState(fingerPosition, true);

            if (finger == null) {
              return;
            }

            focusThumb(finger.thumbIndex);
            setDragging(true);
            // if the event lands on a thumb, don't change the value, just get the
            // percentageValue difference represented by the distance between the click origin
            // and the coordinates of the value on the track area
            if (refs.thumbRefs.includes(event.target as HTMLElement)) {
              offsetRef =
                valueToPercent(values()[finger.thumbIndex], min(), max()) / 100 -
                finger.valueRescaled;
            } else {
              setValue(finger.value, finger.thumbIndex, event);
            }
          }

          if (event.pointerId) {
            controlRef?.setPointerCapture(event.pointerId);
          }

          moveCountRef = 0;
          const doc = ownerDocument(controlRef);
          doc.addEventListener('pointermove', handleTouchMove, { passive: true });
          doc.addEventListener('pointerup', handleTouchEnd);
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export interface FingerPosition {
  x: number;
  y: number;
}

interface FingerState {
  value: number | number[];
  valueRescaled: number;
  thumbIndex: number;
}

export namespace SliderControl {
  export interface Props extends BaseUIComponentProps<'div', SliderRoot.State> {}
}
