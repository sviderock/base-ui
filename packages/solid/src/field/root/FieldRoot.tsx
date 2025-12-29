'use client';
import { batch, createEffect, createSignal, on, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import { useFormContext } from '../../form/FormContext';
import { splitComponentProps, type Args } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { DEFAULT_VALIDITY_STATE, fieldValidityMapping } from '../utils/constants';
import { FieldRootContext, type FieldRootChildRefs } from './FieldRootContext';

/**
 * Groups all parts of the field.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export function FieldRoot(componentProps: FieldRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'name',
    'validate',
    'validationDebounceTime',
    'validationMode',
    'invalid',
  ]);
  const validationDebounceTime = () => local.validationDebounceTime ?? 0;
  const validationMode = () => local.validationMode ?? 'onBlur';
  const disabledProp = () => local.disabled ?? false;

  const { disabled: disabledFieldset } = useFieldsetRootContext();

  const { errors } = useFormContext();

  const validate = (...args: Args<FieldRoot.Props['validate']>) =>
    local.validate?.(...args) ?? null;

  const disabled = () => disabledFieldset() || disabledProp();

  const [controlId, setControlId] = createSignal<string | null | undefined>();
  const [labelId, setLabelId] = createSignal<string | undefined>();
  const [messageIds, setMessageIds] = createSignal<string[]>([]);

  const [childRefs, setChildRefs] = createStore<FieldRootChildRefs>({});

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
    const err = errors();
    return Boolean(
      local.invalid ||
        (local.name && {}.hasOwnProperty.call(err, local.name) && err[local.name] !== undefined),
    );
  };

  const [validityData, setValidityData] = createStore<FieldValidityData>({
    state: DEFAULT_VALIDITY_STATE,
    error: '',
    errors: [],
    value: null,
    initialValue: null,
  });

  const valid = () => !invalid() && validityData.state.valid;

  const state: FieldRoot.State = {
    get disabled() {
      return disabled();
    },
    get touched() {
      return touched();
    },
    get dirty() {
      return dirty();
    },
    get valid() {
      return valid();
    },
    get filled() {
      return filled();
    },
    get focused() {
      return focused();
    },
  };

  const contextValue: FieldRootContext = {
    invalid,
    controlId,
    setControlId,
    labelId,
    setLabelId,
    codependentRefs: childRefs,
    setCodependentRefs: setChildRefs,
    messageIds,
    setMessageIds,
    name: () => local.name,
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

  createEffect(
    on([() => childRefs.control, () => childRefs.label], ([control, label]) => {
      batch(() => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        let controlId: string | null | undefined = undefined;
        // eslint-disable-next-line @typescript-eslint/no-shadow
        let labelId: string | undefined = undefined;

        if (control) {
          if (control.ref()?.closest('label') != null) {
            controlId = control.id() ?? null;
          } else {
            controlId = control.explicitId();
          }
        }

        if (label) {
          if (controlId != null || label?.id() != null) {
            labelId = label!.explicitId();
          }
        }

        setControlId(controlId);
        setLabelId(labelId);
      });

      onCleanup(() => {
        setControlId(undefined);
        setLabelId(undefined);
      });
    }),
  );

  const element = useRenderElement('div', componentProps, {
    state,
    props: elementProps,
    customStyleHookMapping: fieldValidityMapping,
  });

  return <FieldRootContext.Provider value={contextValue}>{element()}</FieldRootContext.Provider>;
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
    disabled?: boolean;
    /**
     * Identifies the field when a form is submitted.
     * Takes precedence over the `name` prop on the `<Field.Control>` component.
     */
    name?: string;
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
    validationMode?: 'onBlur' | 'onChange';
    /**
     * How long to wait between `validate` callbacks if
     * `validationMode="onChange"` is used. Specified in milliseconds.
     * @default 0
     */
    validationDebounceTime?: number;
    /**
     * Whether the field is forcefully marked as invalid.
     */
    invalid?: boolean;
  }
}
