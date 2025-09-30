'use client';
import { createMemo, createSignal, splitProps, type Accessor } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import { useFormContext } from '../../form/FormContext';
import { access, type Args, type MaybeAccessor } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { DEFAULT_VALIDITY_STATE, fieldValidityMapping } from '../utils/constants';
import { FieldRootContext } from './FieldRootContext';

/**
 * Groups all parts of the field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldRoot(componentProps: FieldRoot.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'class',
    'render',
    'disabled',
    'name',
    'validate',
    'validationDebounceTime',
    'validationMode',
    'invalid',
    'children',
  ]);
  const validationDebounceTime = () => access(local.validationDebounceTime) ?? 0;
  const validationMode = () => access(local.validationMode) ?? 'onBlur';
  const disabledProp = () => access(local.disabled) ?? false;
  const name = () => access(local.name);

  const { disabled: disabledFieldset } = useFieldsetRootContext();

  const { errors } = useFormContext();

  const validate = (...args: Args<FieldRoot.Props['validate']>) =>
    local.validate?.(...args) ?? null;

  const disabled = () => disabledFieldset() || disabledProp();

  const [controlId, setControlId] = createSignal<string | null>();
  const [labelId, setLabelId] = createSignal<string>();
  const [messageIds, setMessageIds] = createSignal<string[]>([]);

  const [touched, setTouched] = createSignal(false);
  const [dirty, setDirtyUnwrapped] = createSignal(false);
  const [filled, setFilled] = createSignal(false);
  const [focused, setFocused] = createSignal(false);

  const refs = {
    markedDirtyRef: false,
  };

  const setDirty: typeof setDirtyUnwrapped = (value) => {
    if (value) {
      refs.markedDirtyRef = true;
    }
    setDirtyUnwrapped(value);
  };

  const invalid = () => {
    const n = name();
    const err = errors();
    return Boolean(local.invalid || (n && {}.hasOwnProperty.call(err, n) && err[n] !== undefined));
  };

  const [validityData, setValidityData] = createStore<FieldValidityData>({
    state: DEFAULT_VALIDITY_STATE,
    error: '',
    errors: [],
    value: null,
    initialValue: null,
  });

  const valid = () => !invalid() && validityData.state.valid;

  const state = createMemo<FieldRoot.State>(() => ({
    disabled: disabled(),
    touched: touched(),
    dirty: dirty(),
    valid: valid(),
    filled: filled(),
    focused: focused(),
  }));

  const contextValue: FieldRootContext = {
    invalid,
    controlId,
    setControlId,
    labelId,
    setLabelId,
    messageIds,
    setMessageIds,
    name,
    validityData,
    setValidityData,
    disabled,
    touched,
    setTouched,
    dirty,
    setDirty,
    filled,
    setFilled,
    focused,
    setFocused,
    validate,
    validationMode,
    validationDebounceTime,
    state,
    refs,
  };

  return (
    <FieldRootContext.Provider value={contextValue}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{
          state: state(),
          props: elementProps,
          customStyleHookMapping: fieldValidityMapping,
        }}
      />
    </FieldRootContext.Provider>
  );
}

export interface FieldValidityData {
  state: {
    badInput: boolean;
    customError: boolean;
    patternMismatch: boolean;
    rangeOverflow: boolean;
    rangeUnderflow: boolean;
    stepMismatch: boolean;
    tooLong: boolean;
    tooShort: boolean;
    typeMismatch: boolean;
    valueMissing: boolean;
    valid: boolean | null;
  };
  error: string;
  errors: string[];
  value: unknown;
  initialValue: unknown;
}

export namespace FieldRoot {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    touched: boolean;
    dirty: boolean;
    valid: boolean | null;
    filled: boolean;
    focused: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the component should ignore user interaction.
     * Takes precedence over the `disabled` prop on the `<Field.Control>` component.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Identifies the field when a form is submitted.
     * Takes precedence over the `name` prop on the `<Field.Control>` component.
     */
    name?: MaybeAccessor<string | undefined>;
    /**
     * A function for custom validation. Return a string or an array of strings with
     * the error message(s) if the value is invalid, or `null` if the value is valid.
     */
    validate?: (
      value: unknown,
      formValues: Record<string, unknown>,
    ) => string | string[] | null | Promise<string | string[] | null>;
    /**
     * Determines when the field should be validated.
     *
     * - **onBlur** triggers validation when the control loses focus
     * - **onChange** triggers validation on every change to the control value
     * @default 'onBlur'
     */
    validationMode?: MaybeAccessor<'onBlur' | 'onChange' | undefined>;
    /**
     * How long to wait between `validate` callbacks if
     * `validationMode="onChange"` is used. Specified in milliseconds.
     * @default 0
     */
    validationDebounceTime?: MaybeAccessor<number | undefined>;
    /**
     * Whether the field is forcefully marked as invalid.
     */
    invalid?: MaybeAccessor<boolean | undefined>;
  }
}
