'use client';
import { createEffect, createMemo, createSignal, For, onMount, Show } from 'solid-js';
import { CompositeList, type CompositeMetadata } from '../../composite/list/CompositeList';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useField } from '../../field/useField';
import { activeElement } from '../../floating-ui-solid/utils';
import { useFormContext } from '../../form/FormContext';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { clamp } from '../../utils/clamp';
import { ownerDocument } from '../../utils/owner';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { warn } from '../../utils/warn';
import type { ThumbMetadata } from '../thumb/SliderThumb';
import { asc } from '../utils/asc';
import { getSliderValue } from '../utils/getSliderValue';
import { validateMinimumDistance } from '../utils/validateMinimumDistance';
import { SliderRootContext } from './SliderRootContext';
import { sliderStyleHookMapping } from './styleHooks';

function areValuesEqual(
  newValue: number | readonly number[],
  oldValue: number | readonly number[],
) {
  if (typeof newValue === 'number' && typeof oldValue === 'number') {
    return newValue === oldValue;
  }
  if (Array.isArray(newValue) && Array.isArray(oldValue)) {
    return areArraysEqual(newValue, oldValue);
  }
  return false;
}

/**
 * Groups all parts of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderRoot<Value extends number | readonly number[]>(
  componentProps: SliderRoot.Props<Value>,
) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'aria-labelledby',
    'defaultValue',
    'disabled',
    'id',
    'refs',
    'format',
    'largeStep',
    'locale',
    'max',
    'min',
    'minStepsBetweenValues',
    'name',
    'onValueChange',
    'onValueCommitted',
    'orientation',
    'step',
    'tabIndex',
    'value',
  ]);
  const ariaLabelledbyProp = () => access(local['aria-labelledby']);
  const defaultValue = () => access(local.defaultValue);
  const disabledProp = () => access(local.disabled) ?? false;
  const idProp = () => access(local.id);
  const format = () => access(local.format);
  const largeStep = () => access(local.largeStep) ?? 10;
  const locale = () => access(local.locale);
  const max = () => access(local.max) ?? 100;
  const min = () => access(local.min) ?? 0;
  const minStepsBetweenValues = () => access(local.minStepsBetweenValues) ?? 0;
  const nameProp = () => access(local.name);
  const orientation = () => access(local.orientation) ?? 'horizontal';
  const step = () => access(local.step) ?? 1;
  const externalTabIndex = () => access(local.tabIndex);
  const valueProp = () => access(local.value);

  const id = useBaseUiId(idProp);

  const { clearErrors } = useFormContext();
  const {
    labelId,
    state: fieldState,
    disabled: fieldDisabled,
    name: fieldName,
    setTouched,
    setDirty,
    validityData,
    validationMode,
    setCodependentRefs,
  } = useFieldRootContext();

  const fieldControlValidation = useFieldControlValidation();

  const ariaLabelledby = () => ariaLabelledbyProp() ?? labelId();
  const disabled = () => fieldDisabled() || disabledProp();
  const name = () => fieldName() ?? nameProp() ?? '';

  // The internal value is potentially unsorted, e.g. to support frozen arrays
  // https://github.com/mui/material-ui/pull/28472
  const [valueUnwrapped, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: () => defaultValue() ?? min(),
    name: 'Slider',
  });

  const refs: SliderRootContext['refs'] = {
    thumbRefs: [],
    formatOptionsRef: format(),
    lastChangedValueRef: null,
  };

  let sliderRef = null as HTMLElement | null | undefined;
  let controlRef = null as HTMLElement | null | undefined;

  // We can't use the :active browser pseudo-classes.
  // - The active state isn't triggered when clicking on the rail.
  // - The active state isn't transferred when inversing a range slider.
  const [active, setActive] = createSignal(-1);
  const [dragging, setDragging] = createSignal(false);
  const [thumbArray, setThumbArray] = createSignal<
    Array<{ element: Element; metadata: CompositeMetadata<ThumbMetadata> | null }>
  >([]);

  useField({
    id,
    commitValidation: fieldControlValidation.commitValidation,
    value: valueUnwrapped,
    controlRef: () => controlRef,
    name,
    getValue: valueUnwrapped,
  });

  const registerFieldControlRef = (element: Element | null | undefined) => {
    if (element) {
      controlRef = element as HTMLElement;
    }
  };

  const range = () => Array.isArray(valueUnwrapped());

  const values = createMemo(() => {
    if (!range()) {
      return [clamp(valueUnwrapped() as number, min(), max())];
    }
    return (valueUnwrapped() as unknown as Array<number>).slice().sort(asc);
  });

  const setValue = (newValue: number | number[], thumbIndex: number, event: Event) => {
    if (Number.isNaN(newValue) || areValuesEqual(newValue, valueUnwrapped())) {
      return;
    }

    // TODO: Fix this? Was `as Value` previously
    setValueUnwrapped(newValue as any);
    // Redefine target to allow name and value to be read.
    // This allows seamless integration with the most popular form libraries.
    // https://github.com/mui/material-ui/issues/13485#issuecomment-676048492
    // Clone the event to not override `target` of the original event.
    // @ts-ignore The nativeEvent is function, not object
    const clonedEvent = new event.constructor(event.type, event);

    Object.defineProperty(clonedEvent, 'target', {
      writable: true,
      value: { value: newValue, name: name() },
    });

    refs.lastChangedValueRef = newValue;
    local.onValueChange?.(newValue as any, clonedEvent, thumbIndex);
    clearErrors(name());
    fieldControlValidation.commitValidation(newValue, true);
  };

  // for keypresses only
  const handleInputChange = (
    valueInput: number,
    index: number,
    event: KeyboardEvent | InputEvent,
  ) => {
    const newValue = getSliderValue(valueInput, index, min(), max(), range(), values());

    if (validateMinimumDistance(newValue, step(), minStepsBetweenValues())) {
      setValue(newValue, index, event);
      setDirty(newValue !== validityData.initialValue);
      setTouched(true);

      const nextValue = refs.lastChangedValueRef ?? newValue;
      local.onValueCommitted?.(nextValue as any, event);
      clearErrors(name());

      if (validationMode() === 'onChange') {
        fieldControlValidation.commitValidation(nextValue ?? newValue);
      } else {
        fieldControlValidation.commitValidation(nextValue ?? newValue, true);
      }
    }
  };

  const handleHiddenInputFocus = () => {
    // focus the first thumb if the hidden input receives focus
    refs.thumbRefs[0]?.focus();
  };

  createEffect(() => {
    if (valueProp() === undefined || dragging()) {
      return;
    }

    if (min() >= max()) {
      warn('Slider `max` must be greater than `min`');
    }
  });

  createEffect(() => {
    const activeEl = activeElement(ownerDocument(sliderRef));
    if (disabled() && sliderRef?.contains(activeEl)) {
      // This is necessary because Firefox and Safari will keep focus
      // on a disabled element:
      // https://codesandbox.io/p/sandbox/mui-pr-22247-forked-h151h?file=/src/App.js
      // @ts-ignore
      activeEl.blur();
    }
  });

  createEffect(() => {
    if (disabled() && active() !== -1) {
      setActive(-1);
    }
  });

  onMount(() => {
    setCodependentRefs('control', { explicitId: id, ref: () => sliderRef, id: idProp });
  });

  const state = createMemo<SliderRoot.State>(() => ({
    ...fieldState(),
    activeThumbIndex: active(),
    disabled: disabled(),
    dragging: dragging(),
    orientation: orientation(),
    max: max(),
    min: min(),
    minStepsBetweenValues: minStepsBetweenValues(),
    step: step(),
    values: values(),
  }));

  const contextValue: SliderRootContext = {
    active,
    disabled,
    dragging,
    fieldControlValidation,
    refs,
    handleInputChange,
    labelId: ariaLabelledby,
    largeStep,
    locale,
    max,
    min,
    minStepsBetweenValues,
    onValueCommitted: (...args: any[]) => (local.onValueCommitted as Function)?.(...args),
    orientation,
    range,
    registerFieldControlRef,
    setActive,
    setDragging,
    setValue,
    state,
    step,
    tabIndex: () => externalTabIndex() ?? null,
    thumbArray,
    values,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      sliderRef = el;
    },
    customStyleHookMapping: sliderStyleHookMapping,
    props: [
      () => ({
        'aria-labelledby': ariaLabelledby(),
        id: id(),
        role: 'group',
      }),
      fieldControlValidation.getValidationProps,
      elementProps,
    ],
  });

  return (
    <SliderRootContext.Provider value={contextValue}>
      <CompositeList refs={{ elements: refs.thumbRefs }} onMapChange={setThumbArray}>
        {element()}

        <Show
          when={range()}
          fallback={
            <input
              ref={(el) => {
                if (local.refs) {
                  local.refs.inputRef = el;
                }
                fieldControlValidation.refs.inputRef = el;
              }}
              {...fieldControlValidation.getInputValidationProps({
                disabled,
                name: name(),
                value: valueUnwrapped,
                onFocus: handleHiddenInputFocus,
                style: visuallyHidden,
                tabIndex: -1,
                'aria-hidden': true,
              })}
            />
          }
        >
          <For each={values()}>
            {(value) => (
              <input
                ref={(el) => {
                  if (local.refs) {
                    local.refs.inputRef = el;
                  }
                  fieldControlValidation.refs.inputRef = el;
                }}
                {...fieldControlValidation.getInputValidationProps({
                  disabled: disabled(),
                  name: name(),
                  value,
                  onFocus: handleHiddenInputFocus,
                  style: visuallyHidden,
                  tabIndex: -1,
                  'aria-hidden': true,
                })}
              />
            )}
          </For>
        </Show>
      </CompositeList>
    </SliderRootContext.Provider>
  );
}
//  as {
//   <Value extends number | readonly number[]>(
//     props: SliderRoot.Props<Value> & {
//       ref?: React.RefObject<HTMLDivElement>;
//     },
//   ): React.JSX.Element;
// };

export namespace SliderRoot {
  export interface State extends FieldRoot.State {
    /**
     * The index of the active thumb.
     */
    activeThumbIndex: number;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the thumb is currently being dragged.
     */
    dragging: boolean;
    max: number;
    min: number;
    /**
     * The minimum steps between values in a range slider.
     * @default 0
     */
    minStepsBetweenValues: number;
    /**
     * The component orientation.
     */
    orientation: Orientation;
    /**
     * The step increment of the slider when incrementing or decrementing. It will snap
     * to multiples of this value. Decimal values are supported.
     * @default 1
     */
    step: number;
    /**
     * The raw number value of the slider.
     */
    values: readonly number[];
  }

  export interface Props<Value extends number | readonly number[] = number | readonly number[]>
    extends Omit<BaseUIComponentProps<'div', State>, 'tabIndex'> {
    /**
     * The uncontrolled value of the slider when it’s initially rendered.
     *
     * To render a controlled slider, use the `value` prop instead.
     */
    defaultValue?: MaybeAccessor<Value | undefined>;
    /**
     * Whether the slider should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Options to format the input value.
     */
    format?: MaybeAccessor<Intl.NumberFormatOptions | undefined>;
    refs?: {
      /**
       * A ref to access the hidden input element.
       */
      inputRef?: HTMLInputElement | null | undefined;
    };
    /**
     * The locale used by `Intl.NumberFormat` when formatting the value.
     * Defaults to the user's runtime locale.
     */
    locale?: MaybeAccessor<Intl.LocalesArgument | undefined>;
    /**
     * The maximum allowed value of the slider.
     * Should not be equal to min.
     * @default 100
     */
    max?: MaybeAccessor<number | undefined>;
    /**
     * The minimum allowed value of the slider.
     * Should not be equal to max.
     * @default 0
     */
    min?: MaybeAccessor<number | undefined>;
    /**
     * The minimum steps between values in a range slider.
     * @default 0
     */
    minStepsBetweenValues?: MaybeAccessor<number | undefined>;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: MaybeAccessor<string | undefined>;
    /**
     * The component orientation.
     * @default 'horizontal'
     */
    orientation?: MaybeAccessor<Orientation | undefined>;
    /**
     * The granularity with which the slider can step through values. (A "discrete" slider.)
     * The `min` prop serves as the origin for the valid values.
     * We recommend (max - min) to be evenly divisible by the step.
     * @default 1
     */
    step?: MaybeAccessor<number | undefined>;
    /**
     * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
     * @default 10
     */
    largeStep?: MaybeAccessor<number | undefined>;
    /**
     * Optional tab index attribute for the thumb components.
     */
    tabIndex?: MaybeAccessor<number | undefined>;
    /**
     * The value of the slider.
     * For ranged sliders, provide an array with two values.
     */
    value?: MaybeAccessor<Value | undefined>;
    /**
     * Callback function that is fired when the slider's value changed.
     *
     * @param {number | number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * You can pull out the new value by accessing `event.target.value` (any).
     * @param {number} activeThumbIndex Index of the currently moved thumb.
     *
     * @type {((value: (number | number[]), event: Event, activeThumbIndex: number) => void)}
     */
    onValueChange?: (
      value: Value extends number ? number : Value,
      event: Event,
      activeThumbIndex: number,
    ) => void;
    /**
     * Callback function that is fired when the `pointerup` is triggered.
     *
     * @param {number | number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * **Warning**: This is a generic event not a change event.
     *
     * @type {((value: (number | number[]), event: Event) => void)}
     */
    onValueCommitted?: (value: Value extends number ? number : Value, event: Event) => void;
  }
}
