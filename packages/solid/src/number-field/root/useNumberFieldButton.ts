'use client';
import { access, type MaybeAccessor } from '../../solid-helpers';
import type { HTMLProps } from '../../utils/types';
import type { Timeout } from '../../utils/useTimeout';
import {
  DEFAULT_STEP,
  MAX_POINTER_MOVES_AFTER_TOUCH,
  SCROLLING_POINTER_MOVE_DISTANCE,
  TOUCH_TIMEOUT,
} from '../utils/constants';
import { parseNumber } from '../utils/parse';
import type { EventWithOptionalKeyState } from '../utils/types';

export function useNumberFieldButton(
  params: useNumberFieldButton.Parameters,
): useNumberFieldButton.ReturnValue {
  const disabled = () => access(params.disabled);
  const id = () => access(params.id);
  const inputValue = () => access(params.inputValue);
  const isIncrement = () => access(params.isIncrement);
  const locale = () => access(params.locale);
  const maxWithDefault = () => access(params.maxWithDefault);
  const minWithDefault = () => access(params.minWithDefault);
  const readOnly = () => access(params.readOnly);
  const value = () => access(params.value);

  let incrementDownCoordsRef = { x: 0, y: 0 };
  let isTouchingButtonRef = false;
  let ignoreClickRef = false;
  let pointerTypeRef = '' as 'mouse' | 'touch' | 'pen' | '';

  const isMin = () => value() != null && value()! <= minWithDefault();
  const isMax = () => value() != null && value()! >= maxWithDefault();

  const commitValue = (nativeEvent: MouseEvent) => {
    params.refs.allowInputSyncRef = true;

    // The input may be dirty but not yet blurred, so the value won't have been committed.
    const parsedValue = parseNumber(inputValue(), locale(), params.refs.formatOptionsRef);

    if (parsedValue !== null) {
      // The increment value function needs to know the current input value to increment it
      // correctly.
      params.refs.valueRef = parsedValue;
      params.setValue(parsedValue, nativeEvent);
    }
  };

  const props: HTMLProps = {
    // @ts-expect-error - disabled is not a valid attribute for HTMLProps
    get disabled() {
      return disabled() || (isIncrement() ? isMax() : isMin());
    },
    get 'aria-readonly'() {
      return readOnly() || undefined;
    },
    get 'aria-label'() {
      return isIncrement() ? 'Increase' : 'Decrease';
    },
    get 'aria-controls'() {
      return id();
    },
    // Keyboard users shouldn't have access to the buttons, since they can use the input element
    // to change the value. On the other hand, `aria-hidden` is not applied because touch screen
    // readers should be able to use the buttons.
    tabIndex: -1,
    style: {
      '--webkit-user-select': 'none',
      'user-select': 'none',
    },
    onTouchStart() {
      isTouchingButtonRef = true;
    },
    onTouchEnd() {
      isTouchingButtonRef = false;
    },
    onClick(event) {
      const isDisabled = disabled() || readOnly() || (isIncrement() ? isMax() : isMin());
      if (
        event.defaultPrevented ||
        isDisabled ||
        // If it's not a keyboard/virtual click, ignore.
        (pointerTypeRef === 'touch' ? ignoreClickRef : event.detail !== 0)
      ) {
        return;
      }

      commitValue(event);

      const amount = params.getStepAmount(event) ?? DEFAULT_STEP;

      params.incrementValue(amount, isIncrement() ? 1 : -1, undefined, event);
    },
    onPointerDown(event) {
      const isMainButton = !event.button || event.button === 0;
      const isDisabled = disabled() || (isIncrement() ? isMax() : isMin());
      if (event.defaultPrevented || readOnly() || !isMainButton || isDisabled) {
        return;
      }

      pointerTypeRef = event.pointerType as 'mouse' | 'touch' | 'pen' | '';
      ignoreClickRef = false;
      params.refs.isPressedRef = true;
      incrementDownCoordsRef = { x: event.clientX, y: event.clientY };

      commitValue(event);

      // Note: "pen" is sometimes returned for mouse usage on Linux Chrome.
      if (event.pointerType !== 'touch') {
        event.preventDefault();
        params.refs.inputRef?.focus();
        params.startAutoChange(isIncrement(), event);
      } else {
        // We need to check if the pointerdown was intentional, and not the result of a scroll
        // or pinch-zoom. In that case, we don't want to change the value.
        params.intentionalTouchCheckTimeout.start(TOUCH_TIMEOUT, () => {
          const moves = params.refs.movesAfterTouchRef;
          params.refs.movesAfterTouchRef = 0;
          if (moves != null && moves < MAX_POINTER_MOVES_AFTER_TOUCH) {
            ignoreClickRef = true;
            params.startAutoChange(isIncrement(), event);
          } else {
            params.stopAutoChange();
          }
        });
      }
    },
    onPointerMove(event) {
      const isDisabled = disabled() || readOnly() || (isIncrement() ? isMax() : isMin());
      if (isDisabled || event.pointerType !== 'touch' || !params.refs.isPressedRef) {
        return;
      }

      if (params.refs.movesAfterTouchRef != null) {
        params.refs.movesAfterTouchRef += 1;
      }

      const { x, y } = incrementDownCoordsRef;
      const dx = x - event.clientX;
      const dy = y - event.clientY;

      // An alternative to this technique is to detect when the NumberField's parent container
      // has been scrolled
      if (dx ** 2 + dy ** 2 > SCROLLING_POINTER_MOVE_DISTANCE ** 2) {
        params.stopAutoChange();
      }
    },
    onMouseEnter(event) {
      const isDisabled = disabled() || readOnly() || (isIncrement() ? isMax() : isMin());
      if (
        event.defaultPrevented ||
        isDisabled ||
        !params.refs.isPressedRef ||
        isTouchingButtonRef
      ) {
        return;
      }

      params.startAutoChange(isIncrement(), event);
    },
    onMouseLeave() {
      if (isTouchingButtonRef) {
        return;
      }

      params.stopAutoChange();
    },
    onMouseUp() {
      if (isTouchingButtonRef) {
        return;
      }

      params.stopAutoChange();
    },
  };

  return { props };
}

export namespace useNumberFieldButton {
  export interface Parameters {
    refs: {
      inputRef: HTMLInputElement | null | undefined;
      allowInputSyncRef: boolean | null;
      formatOptionsRef: Intl.NumberFormatOptions | undefined;
      valueRef: number | null;
      isPressedRef: boolean | null;
      movesAfterTouchRef: number | null;
    };
    disabled: MaybeAccessor<boolean>;
    getStepAmount: (event?: EventWithOptionalKeyState) => number | undefined;
    id: MaybeAccessor<string | undefined>;
    incrementValue: (
      amount: number,
      dir: 1 | -1,
      currentValue?: number | null,
      event?: Event,
    ) => void;
    inputValue: MaybeAccessor<string>;
    intentionalTouchCheckTimeout: Timeout;
    isIncrement: MaybeAccessor<boolean>;
    locale?: MaybeAccessor<Intl.LocalesArgument | undefined>;
    maxWithDefault: MaybeAccessor<number>;
    minWithDefault: MaybeAccessor<number>;
    readOnly: MaybeAccessor<boolean>;
    setValue: (unvalidatedValue: number | null, event?: Event) => void;
    startAutoChange: (isIncrement: boolean, event?: MouseEvent | Event) => void;
    stopAutoChange: () => void;
    value: MaybeAccessor<number | null>;
  }

  export interface ReturnValue {
    props: HTMLProps;
  }
}
