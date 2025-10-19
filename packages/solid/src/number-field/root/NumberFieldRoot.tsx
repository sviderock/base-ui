'use client';
import { batch, createEffect, createMemo, createSignal, on, onCleanup, Show } from 'solid-js';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { isIOS } from '../../utils/detectBrowser';
import { formatNumber, formatNumberMaxPrecision } from '../../utils/formatNumber';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useInterval } from '../../utils/useInterval';
import { RenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import { CHANGE_VALUE_TICK_DELAY, DEFAULT_STEP, START_AUTO_CHANGE_DELAY } from '../utils/constants';
import { getNumberLocaleDetails, PERCENTAGES } from '../utils/parse';
import { styleHookMapping } from '../utils/styleHooks';
import { EventWithOptionalKeyState } from '../utils/types';
import { toValidatedNumber } from '../utils/validate';
import { InputMode, NumberFieldRootContext } from './NumberFieldRootContext';

/**
 * Groups all parts of the number field and manages its state.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldRoot(componentProps: NumberFieldRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'id',
    'min',
    'max',
    'smallStep',
    'step',
    'largeStep',
    'required',
    'disabled',
    'readOnly',
    'name',
    'defaultValue',
    'value',
    'onValueChange',
    'allowWheelScrub',
    'snapOnStep',
    'format',
    'locale',
    'refs',
  ]);
  const idProp = () => access(local.id);
  const min = () => access(local.min);
  const max = () => access(local.max);
  const smallStep = () => access(local.smallStep) ?? 0.1;
  const step = () => access(local.step) ?? 1;
  const largeStep = () => access(local.largeStep) ?? 10;
  const required = () => access(local.required) ?? false;
  const disabledProp = () => access(local.disabled) ?? false;
  const readOnly = () => access(local.readOnly) ?? false;
  const nameProp = () => access(local.name);
  const defaultValue = () => access(local.defaultValue);
  const valueProp = () => access(local.value);
  const allowWheelScrub = () => access(local.allowWheelScrub) ?? false;
  const snapOnStep = () => access(local.snapOnStep) ?? false;
  const format = () => access(local.format);
  const locale = () => access(local.locale);

  const {
    setControlId,
    setDirty,
    validityData,
    setValidityData,
    disabled: fieldDisabled,
    setFilled,
    invalid,
    name: fieldName,
    state: fieldState,
  } = useFieldRootContext();

  const disabled = () => fieldDisabled() || disabledProp();
  const name = () => fieldName() ?? nameProp();

  const [isScrubbing, setIsScrubbing] = createSignal(false);

  const minWithDefault = () => min() ?? Number.MIN_SAFE_INTEGER;
  const maxWithDefault = () => max() ?? Number.MAX_SAFE_INTEGER;
  const minWithZeroDefault = () => min() ?? 0;
  const formatStyle = () => format()?.style;

  const id = useBaseUiId(idProp);

  createEffect(() => {
    setControlId(id());
    onCleanup(() => {
      setControlId(undefined);
    });
  });

  const [valueUnwrapped, setValueUnwrapped] = useControlled<number | null>({
    controlled: valueProp,
    default: defaultValue,
    name: 'NumberField',
    state: 'value',
  });

  const value = () => valueUnwrapped() ?? null;

  const refs: NumberFieldRootContext['refs'] = {
    inputRef: null,
    allowInputSyncRef: true,
    formatOptionsRef: format(),
    valueRef: value(),
    isPressedRef: false,
    movesAfterTouchRef: 0,
  };

  createEffect(() => {
    refs.valueRef = value();
  });

  createEffect(() => {
    setFilled(value() !== null);
  });

  const startTickTimeout = useTimeout();
  const tickInterval = useInterval();
  const intentionalTouchCheckTimeout = useTimeout();
  let unsubscribeFromGlobalContextMenuRef = () => {};

  createEffect(() => {
    if (validityData.initialValue === null && value() !== validityData.initialValue) {
      setValidityData('initialValue', value());
    }
  });

  function getProcessedValue() {
    if (valueProp() !== undefined) {
      return getControlledInputValue(value(), locale(), format());
    }
    return formatNumber(value(), locale(), format());
  }

  // During SSR, the value is formatted on the server, whose locale may differ from the client's
  // locale. This causes a hydration mismatch, which we manually suppress. This is preferable to
  // rendering an empty input field and then updating it with the formatted value, as the user
  // can still see the value prior to hydration, even if it's not formatted correctly.
  const [inputValue, setInputValueUnwrapped] = createSignal(getProcessedValue());
  const [inputMode, setInputMode] = createSignal<InputMode>('numeric');

  createEffect(
    on([value, valueProp, locale, format, inputValue], () => {
      if (!refs.allowInputSyncRef) {
        return;
      }

      const nextInputValue =
        valueProp() !== undefined
          ? getControlledInputValue(value(), locale(), format())
          : formatNumber(value(), locale(), format());

      if (nextInputValue !== inputValue()) {
        setInputValueUnwrapped(nextInputValue);
      }
    }),
  );

  const setInputValue = (nextInputValue: string) => {
    // We need to update the input value when the external `value` prop changes. This ends up acting
    // as a single source of truth to update the input value, bypassing the need to manually set it in
    // each event handler internally in this hook.
    // This is done inside a layout effect as an alternative to the technique to set state during
    // render as we're accessing a ref, which must be inside an effect.
    // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    if (refs.allowInputSyncRef) {
      const nextVal = getProcessedValue();
      if (nextVal !== nextInputValue) {
        setInputValueUnwrapped(nextVal);
        return;
      }
    }
    setInputValueUnwrapped(nextInputValue);
  };

  const getAllowedNonNumericKeys = () => {
    const { decimal, group, currency } = getNumberLocaleDetails(locale(), format());

    const keys = new Set(['.', ',', decimal, group]);

    if (formatStyle() === 'percent') {
      PERCENTAGES.forEach((key) => keys.add(key));
    }
    if (formatStyle() === 'currency' && currency) {
      keys.add(currency);
    }
    if (minWithDefault() < 0) {
      keys.add('-');
    }

    return keys;
  };

  const getStepAmount = (event?: EventWithOptionalKeyState) => {
    if (event?.altKey) {
      return smallStep();
    }
    if (event?.shiftKey) {
      return largeStep();
    }
    return step();
  };

  const setValue = (unvalidatedValue: number | null, event?: MouseEvent | Event, dir?: 1 | -1) => {
    const eventWithOptionalKeyState = event as EventWithOptionalKeyState;
    const validatedValue = toValidatedNumber(unvalidatedValue, {
      step: dir ? getStepAmount(eventWithOptionalKeyState) * dir : undefined,
      format: refs.formatOptionsRef,
      minWithDefault: minWithDefault(),
      maxWithDefault: maxWithDefault(),
      minWithZeroDefault: minWithZeroDefault(),
      snapOnStep: snapOnStep(),
      small: eventWithOptionalKeyState?.altKey ?? false,
    });

    batch(() => {
      local.onValueChange?.(validatedValue, event);
      setValueUnwrapped(validatedValue);
      setDirty(validatedValue !== validityData.initialValue);

      // Keep the visible input in sync immediately when programmatic changes occur
      // (increment/decrement, wheel, etc). During direct typing we don't want
      // to overwrite the user-provided text until blur, so we gate on
      // `allowInputSyncRef`.
      if (refs.allowInputSyncRef) {
        setInputValueUnwrapped(formatNumber(validatedValue, locale(), format()));
      }
    });
    // TODO: force render
    // Formatting can change even if the numeric value hasn't, so ensure a re-render when needed.
    // forceRender();
  };

  const incrementValue = (
    amount: number,
    dir: 1 | -1,
    currentValue?: number | null,
    event?: MouseEvent | Event,
  ) => {
    const prevValue = currentValue == null ? refs.valueRef : currentValue;
    const nextValue =
      typeof prevValue === 'number' ? prevValue + amount * dir : Math.max(0, min() ?? 0);
    setValue(nextValue, event, dir);
  };

  const stopAutoChange = () => {
    batch(() => {
      intentionalTouchCheckTimeout.clear();
      startTickTimeout.clear();
      tickInterval.clear();
      unsubscribeFromGlobalContextMenuRef();
      refs.movesAfterTouchRef = 0;
    });
  };

  const startAutoChange = (isIncrement: boolean, triggerEvent?: MouseEvent | Event) => {
    stopAutoChange();

    if (!refs.inputRef) {
      return;
    }

    const win = ownerWindow(refs.inputRef);

    function handleContextMenu(event: Event) {
      event.preventDefault();
    }

    // A global context menu is necessary to prevent the context menu from appearing when the touch
    // is slightly outside of the element's hit area.
    win.addEventListener('contextmenu', handleContextMenu);
    unsubscribeFromGlobalContextMenuRef = () => {
      win.removeEventListener('contextmenu', handleContextMenu);
    };

    win.addEventListener(
      'pointerup',
      () => {
        refs.isPressedRef = false;
        stopAutoChange();
      },
      { once: true },
    );

    function tick() {
      const amount = getStepAmount(triggerEvent as EventWithOptionalKeyState) ?? DEFAULT_STEP;
      incrementValue(amount, isIncrement ? 1 : -1, undefined, triggerEvent);
    }

    tick();

    startTickTimeout.start(START_AUTO_CHANGE_DELAY, () => {
      tickInterval.start(CHANGE_VALUE_TICK_DELAY, tick);
    });
  };

  createEffect(function setDynamicInputModeForIOS() {
    if (!isIOS) {
      return;
    }

    // iOS numeric software keyboard doesn't have a minus key, so we need to use the default
    // keyboard to let the user input a negative number.
    let computedInputMode: ReturnType<typeof inputMode> = 'text';

    if (minWithDefault() >= 0) {
      // iOS numeric software keyboard doesn't have a decimal key for "numeric" input mode, but
      // this is better than the "text" input if possible to use.
      computedInputMode = 'decimal';
    }

    setInputMode(computedInputMode);
  });

  onCleanup(() => stopAutoChange());

  // The `onWheel` prop can't be prevented, so we need to use a global event listener.
  createEffect(function registerElementWheelListener() {
    const element = refs.inputRef;
    if (disabled() || readOnly() || !allowWheelScrub() || !element) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      if (
        // Allow pinch-zooming.
        event.ctrlKey ||
        ownerDocument(refs.inputRef).activeElement !== refs.inputRef
      ) {
        return;
      }

      // Prevent the default behavior to avoid scrolling the page.
      event.preventDefault();

      const amount = getStepAmount(event) ?? DEFAULT_STEP;

      incrementValue(amount, event.deltaY > 0 ? -1 : 1, undefined, event);
    }

    element.addEventListener('wheel', handleWheel);

    onCleanup(() => {
      element.removeEventListener('wheel', handleWheel);
    });
  });

  const state = createMemo<NumberFieldRoot.State>(() => ({
    ...fieldState(),
    disabled: disabled(),
    readOnly: readOnly(),
    required: required(),
    value: value(),
    inputValue: inputValue(),
    scrubbing: isScrubbing(),
  }));

  const contextValue: NumberFieldRootContext = {
    refs,
    inputValue,
    value,
    startAutoChange,
    stopAutoChange,
    minWithDefault,
    maxWithDefault,
    disabled,
    readOnly,
    id,
    setValue,
    incrementValue,
    getStepAmount,
    intentionalTouchCheckTimeout,
    name,
    required,
    invalid,
    inputMode,
    getAllowedNonNumericKeys,
    min,
    max,
    setInputValue,
    locale,
    isScrubbing,
    setIsScrubbing,
    state,
  };

  return (
    <NumberFieldRootContext.Provider value={contextValue}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{
          state: state(),
          props: elementProps,
          customStyleHookMapping: styleHookMapping,
        }}
      />
      <Show when={name()}>
        <input
          type="hidden"
          name={name()}
          ref={(el) => {
            if (local.refs) {
              local.refs.inputRef = el;
            }
          }}
          value={value() ?? ''}
          disabled={disabled()}
          required={required()}
        />
      </Show>
    </NumberFieldRootContext.Provider>
  );
}

export namespace NumberFieldRoot {
  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'onChange' | 'id'> {
    /**
     * The id of the input element.
     */
    id?: MaybeAccessor<string | undefined>;
    /**
     * The minimum value of the input element.
     */
    min?: MaybeAccessor<number | undefined>;
    /**
     * The maximum value of the input element.
     */
    max?: MaybeAccessor<number | undefined>;
    /**
     * The small step value of the input element when incrementing while the meta key is held. Snaps
     * to multiples of this value.
     * @default 0.1
     */
    smallStep?: MaybeAccessor<number | undefined>;
    /**
     * Amount to increment and decrement with the buttons and arrow keys,
     * or to scrub with pointer movement in the scrub area.
     * @default 1
     */
    step?: MaybeAccessor<number | undefined>;
    /**
     * The large step value of the input element when incrementing while the shift key is held. Snaps
     * to multiples of this value.
     * @default 10
     */
    largeStep?: MaybeAccessor<number | undefined>;
    /**
     * Whether the user must enter a value before submitting a form.
     * @default false
     */
    required?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the field is forcefully marked as invalid.
     * @default false
     */
    invalid?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the user should be unable to change the field value.
     * @default false
     */
    readOnly?: MaybeAccessor<boolean | undefined>;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: MaybeAccessor<string | undefined>;
    /**
     * The raw numeric value of the field.
     */
    value?: MaybeAccessor<number | null | undefined>;
    /**
     * The uncontrolled value of the field when it’s initially rendered.
     *
     * To render a controlled number field, use the `value` prop instead.
     */
    defaultValue?: MaybeAccessor<number | undefined>;
    /**
     * Whether to allow the user to scrub the input value with the mouse wheel while focused and
     * hovering over the input.
     * @default false
     */
    allowWheelScrub?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the value should snap to the nearest step when incrementing or decrementing.
     * @default false
     */
    snapOnStep?: MaybeAccessor<boolean | undefined>;
    /**
     * Options to format the input value.
     */
    format?: MaybeAccessor<Intl.NumberFormatOptions | undefined>;
    /**
     * Callback fired when the number value changes.
     * @param {number | null} value The new value.
     * @param {Event} event The event that triggered the change.
     */
    onValueChange?: (value: number | null, event?: Event) => void;
    /**
     * The locale of the input element.
     * Defaults to the user's runtime locale.
     */
    locale?: MaybeAccessor<Intl.LocalesArgument | undefined>;
    refs?: {
      /**
       * A ref to access the hidden input element.
       */
      inputRef?: HTMLInputElement | null | undefined;
    };
  }

  export interface State extends FieldRoot.State {
    /**
     * The raw numeric value of the field.
     */
    value: number | null;
    /**
     * The formatted string value presented in the input element.
     */
    inputValue: string;
    /**
     * Whether the user must enter a value before submitting a form.
     */
    required: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to change the field value.
     */
    readOnly: boolean;
    /**
     * Whether the user is currently scrubbing the field.
     */
    scrubbing: boolean;
  }
}

function getControlledInputValue(
  value: number | null,
  locale: Intl.LocalesArgument,
  format: Intl.NumberFormatOptions | undefined,
) {
  const explicitPrecision =
    format?.maximumFractionDigits != null || format?.minimumFractionDigits != null;
  return explicitPrecision
    ? formatNumber(value, locale, format)
    : formatNumberMaxPrecision(value, locale, format);
}
