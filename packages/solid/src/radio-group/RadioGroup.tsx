'use client';
import { batch, createEffect, createMemo, createSignal } from 'solid-js';
import { SHIFT } from '../composite/composite';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import type { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useField } from '../field/useField';
import { fieldValidityMapping } from '../field/utils/constants';
import { contains } from '../floating-ui-solid/utils';
import { useFormContext } from '../form/FormContext';
import { mergeProps } from '../merge-props';
import { access, splitComponentProps, type MaybeAccessor } from '../solid-helpers';
import type { BaseUIComponentProps } from '../utils/types';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useControlled } from '../utils/useControlled';
import { RenderElement } from '../utils/useRenderElement';
import { visuallyHidden } from '../utils/visuallyHidden';

import { RadioGroupContext } from './RadioGroupContext';

const MODIFIER_KEYS = [SHIFT];

/**
 * Provides a shared state to a series of radio buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Radio Group](https://base-ui.com/react/components/radio)
 */
export function RadioGroup(componentProps: RadioGroup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'readOnly',
    'required',
    'onValueChange',
    'value',
    'defaultValue',
    'name',
    'refs',
    'id',
  ]);
  const disabledProp = () => access(local.disabled);
  const readOnly = () => access(local.readOnly);
  const required = () => access(local.required);
  const externalValue = () => access(local.value);
  const defaultValue = () => access(local.defaultValue);
  const nameProp = () => access(local.name);
  const idProp = () => access(local.id);

  const {
    labelId,
    setTouched: setFieldTouched,
    setFocused,
    validationMode,
    name: fieldName,
    disabled: fieldDisabled,
    state: fieldState,
  } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();
  const { clearErrors } = useFormContext();

  const disabled = () => fieldDisabled() || disabledProp();
  const name = () => fieldName() ?? nameProp();
  const id = useBaseUiId(idProp);

  const [checkedValue, setCheckedValue] = useControlled({
    controlled: externalValue,
    default: defaultValue,
    name: 'RadioGroup',
    state: 'value',
  });

  let controlRef = null as HTMLElement | null | undefined;
  const registerControlRef = (element: HTMLElement | null | undefined) => {
    if (controlRef == null && element != null) {
      controlRef = element;
    }
  };

  useField({
    id,
    commitValidation: fieldControlValidation.commitValidation,
    value: checkedValue,
    controlRef: () => controlRef,
    name,
    getValue: () => checkedValue() ?? null,
  });

  let prevValueRef = checkedValue();

  createEffect(() => {
    if (prevValueRef === checkedValue()) {
      return;
    }

    clearErrors(name());

    if (validationMode() === 'onChange') {
      fieldControlValidation.commitValidation(checkedValue());
    } else {
      fieldControlValidation.commitValidation(checkedValue(), true);
    }
  });

  createEffect(() => {
    prevValueRef = checkedValue();
  });

  const [touched, setTouched] = createSignal(false);

  const onBlur = (event: FocusEvent) => {
    batch(() => {
      if (!contains(event.currentTarget as Element, event.relatedTarget as Element)) {
        setFieldTouched(true);
        setFocused(false);

        if (validationMode() === 'onBlur') {
          fieldControlValidation.commitValidation(checkedValue());
        }
      }
    });
  };

  const onKeyDownCapture = (event: KeyboardEvent) => {
    if (event.key.startsWith('Arrow')) {
      batch(() => {
        setFieldTouched(true);
        setTouched(true);
        setFocused(true);
      });
    }
  };

  const serializedCheckedValue = createMemo<string>(() => {
    if (checkedValue() == null) {
      return ''; // avoid uncontrolled -> controlled error
    }
    if (typeof checkedValue() === 'string') {
      return checkedValue() as string;
    }
    return JSON.stringify(checkedValue());
  });

  const inputProps = createMemo(() =>
    mergeProps<'input'>(
      {
        value: serializedCheckedValue(),
        id: id(),
        name: name(),
        disabled: disabled(),
        readOnly: readOnly(),
        required: required(),
        'aria-hidden': true,
        tabIndex: -1,
        style: visuallyHidden,
        onFocus() {
          controlRef?.focus();
        },
      },
      fieldControlValidation.getInputValidationProps,
    ),
  );

  const state = createMemo<RadioGroup.State>(() => ({
    ...fieldState(),
    disabled: disabled() ?? false,
    required: required() ?? false,
    readOnly: readOnly() ?? false,
  }));

  return (
    <RadioGroupContext.Provider
      value={{
        ...fieldState(),
        checkedValue,
        disabled,
        name,
        onValueChange: (...args) => local.onValueChange?.(...args),
        readOnly,
        registerControlRef,
        required,
        setCheckedValue,
        setTouched,
        touched,
      }}
    >
      <CompositeRoot
        enableHomeAndEndKeys={false}
        modifierKeys={MODIFIER_KEYS}
        stopEventPropagation
        render={(p) => (
          <RenderElement
            element="div"
            componentProps={componentProps}
            ref={(el) => {
              p().ref(el);
              if (typeof componentProps.ref === 'function') {
                componentProps.ref(el);
              } else {
                componentProps.ref = el;
              }
            }}
            params={{
              state: state(),
              customStyleHookMapping: fieldValidityMapping,
              props: [
                p(),
                {
                  role: 'radiogroup',
                  'aria-required': required() || undefined,
                  'aria-disabled': disabled() || undefined,
                  'aria-readonly': readOnly() || undefined,
                  'aria-labelledby': labelId(),
                  onFocus() {
                    setFocused(true);
                  },
                  onBlur,
                  onKeyDown: onKeyDownCapture,
                },
                fieldControlValidation.getValidationProps,
                elementProps,
              ],
            }}
          />
        )}
      />
      <input
        ref={(el) => {
          if (local.refs) {
            local.refs.inputRef = el;
          }
          fieldControlValidation.refs.inputRef = el;
        }}
        {...inputProps()}
      />
    </RadioGroupContext.Provider>
  );
}

export namespace RadioGroup {
  export interface State extends FieldRoot.State {
    /**
     * Whether the user should be unable to select a different radio button in the group.
     */
    readOnly: boolean | undefined;
  }

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'value'> {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the user should be unable to select a different radio button in the group.
     * @default false
     */
    readOnly?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: MaybeAccessor<boolean | undefined>;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: MaybeAccessor<string | undefined>;
    /**
     * The controlled value of the radio item that should be currently selected.
     *
     * To render an uncontrolled radio group, use the `defaultValue` prop instead.
     */
    value?: MaybeAccessor<unknown | undefined>;
    /**
     * The uncontrolled value of the radio button that should be initially selected.
     *
     * To render a controlled radio group, use the `value` prop instead.
     */
    defaultValue?: MaybeAccessor<unknown | undefined>;
    /**
     * Callback fired when the value changes.
     */
    onValueChange?: (value: unknown, event: Event) => void;
    refs?: {
      /**
       * A ref to access the hidden input element.
       */
      inputRef: HTMLInputElement | null | undefined;
    };
  }
}
