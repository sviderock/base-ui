'use client';
import {
  batch,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
  type JSX,
} from 'solid-js';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useField } from '../../field/useField';
import { useFormContext } from '../../form/FormContext';
import { mergeProps } from '../../merge-props';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useCustomStyleHookMapping } from '../utils/useCustomStyleHookMapping';
import { CheckboxRootContext } from './CheckboxRootContext';

const EMPTY = {};
export const PARENT_CHECKBOX = 'data-parent';

/**
 * Represents the checkbox itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export function CheckboxRoot(componentProps: CheckboxRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'checked',
    'defaultChecked',
    'disabled',
    'id',
    'indeterminate',
    'inputRef',
    'name',
    'onCheckedChange',
    'parent',
    'readOnly',
    'render',
    'required',
    'value',
    'nativeButton',
  ]);
  const checkedProp = () => access(local.checked);
  const defaultChecked = () => access(local.defaultChecked) ?? false;
  const disabledProp = () => access(local.disabled) ?? false;
  const idProp = () => access(local.id);
  const indeterminate = () => access(local.indeterminate) ?? false;
  const nameProp = () => access(local.name);
  const parent = () => access(local.parent) ?? false;
  const readOnly = () => access(local.readOnly) ?? false;
  const required = () => access(local.required) ?? false;
  const valueProp = () => access(local.value);
  const nativeButton = () => access(local.nativeButton) ?? true;

  const { clearErrors } = useFormContext();
  const {
    disabled: fieldDisabled,
    labelId,
    name: fieldName,
    setControlId,
    setDirty,
    setFilled,
    setFocused,
    setTouched,
    state: fieldState,
    validationMode,
    validityData,
    setChildRefs,
  } = useFieldRootContext();

  const groupContext = useCheckboxGroupContext();
  const parentContext = () => groupContext?.parent;
  const isGrouped = createMemo(() => parentContext() && groupContext?.allValues());

  const disabled = () => fieldDisabled() || groupContext?.disabled() || disabledProp();
  const name = () => fieldName() ?? nameProp();
  const value = () => valueProp() ?? name();

  const groupProps = createMemo<Partial<Omit<CheckboxRoot.Props, 'class'>>>(() => {
    if (isGrouped()) {
      if (parent()) {
        return groupContext!.parent.getParentProps();
      }

      if (value()) {
        return groupContext!.parent.getChildProps(value()!);
      }
    }

    return {};
  });

  const groupPropsSplitted = createMemo(() => {
    return splitProps(groupProps(), ['checked', 'indeterminate', 'onCheckedChange']);
  });

  const localGroupProps = createMemo(() => {
    const [localProps] = groupPropsSplitted();

    return {
      checked: () => access(localProps.checked) ?? checkedProp(),
      indeterminate: () => access(localProps.indeterminate) ?? indeterminate(),
      onCheckedChange: localProps.onCheckedChange,
    };
  });

  const otherGroupProps = createMemo(() => {
    const [, otherProps] = groupPropsSplitted();
    return otherProps;
  });

  const groupValue = () => groupContext?.value();
  const setGroupValue = groupContext?.setValue;
  const defaultGroupValue = () => groupContext?.defaultValue();

  const [controlRef, setControlRef] = createSignal<HTMLButtonElement | null | undefined>(null);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const localFieldControlValidation = useFieldControlValidation();
  const fieldControlValidation = () =>
    groupContext?.fieldControlValidation ?? localFieldControlValidation;

  const [checked, setCheckedState] = useControlled({
    controlled: () =>
      value() && groupValue() && !parent()
        ? groupValue()!.includes(value()!)
        : localGroupProps().checked(),
    default: () =>
      value() && defaultGroupValue() && !parent()
        ? defaultGroupValue()!.includes(value()!)
        : defaultChecked(),
    name: 'Checkbox',
    state: 'checked',
  });

  const id = useBaseUiId(idProp);

  onMount(() => {
    setChildRefs('control', { explicitId: id, ref: controlRef, id: idProp });
  });

  createRenderEffect(() => {
    if (!controlRef()) {
      return;
    }

    if (groupContext) {
      setControlId(idProp() ?? null);
    } else if (controlRef()?.closest('label') == null) {
      setControlId(id());
    }
  });

  useField({
    enabled: () => !groupContext,
    id,
    commitValidation: (...args) => fieldControlValidation().commitValidation(...args),
    value: checked,
    controlRef,
    name,
    getValue: () => checked(),
  });

  let inputRef = null as HTMLInputElement | null | undefined;

  createEffect(() => {
    if (inputRef) {
      inputRef.indeterminate = localGroupProps().indeterminate();
      if (checked()) {
        setFilled(true);
      }
    }
  });

  const onFocus = () => setFocused(true);

  const onBlur = () => {
    if (!inputRef) {
      return;
    }

    setTouched(true);
    setFocused(false);

    if (validationMode() === 'onBlur') {
      fieldControlValidation().commitValidation(groupContext ? groupValue() : inputRef.checked);
    }
  };

  const onClick = (event: Event) => {
    if (event.defaultPrevented || readOnly()) {
      return;
    }

    event.preventDefault();

    inputRef?.click();
  };

  const inputProps = createMemo<JSX.InputHTMLAttributes<HTMLInputElement>>(() => {
    return mergeProps<'input'>(
      {
        checked: checked(),
        disabled: disabled(),
        // parent checkboxes unset `name` to be excluded from form submission
        name: parent() ? undefined : name(),
        // Set `id` to stop Chrome warning about an unassociated input
        id: `${id()}-input`,
        required: required(),
        style: visuallyHidden,
        tabIndex: -1,
        type: 'checkbox',
        'aria-hidden': true,
        onChange(event) {
          const groupContextValue = groupContext?.value();
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.defaultPrevented) {
            return;
          }

          batch(() => {
            const nextChecked = event.target.checked;
            setDirty(nextChecked !== validityData.initialValue);
            setCheckedState(nextChecked);
            localGroupProps().onCheckedChange?.(nextChecked, event);
            local.onCheckedChange?.(nextChecked, event);
            clearErrors(name());

            if (!groupContext) {
              setFilled(nextChecked);

              if (validationMode() === 'onChange') {
                fieldControlValidation().commitValidation(nextChecked);
              } else {
                fieldControlValidation().commitValidation(nextChecked, true);
              }
            }

            if (value() && groupContextValue && setGroupValue && !parent()) {
              const nextGroupValue = nextChecked
                ? [...groupContextValue!, value()!]
                : groupContextValue!.filter((item) => item !== value());

              setGroupValue(nextGroupValue, event);
              setFilled(nextGroupValue.length > 0);

              if (validationMode() === 'onChange') {
                fieldControlValidation().commitValidation(nextGroupValue);
              } else {
                fieldControlValidation().commitValidation(nextGroupValue, true);
              }
            }
          });
        },
        onFocus() {
          controlRef()?.focus();
        },
      },
      // React <19 sets an empty value if `undefined` is passed explicitly
      // To avoid this, we only set the value if it's defined
      valueProp() !== undefined
        ? { value: (groupContext ? checked() && valueProp() : valueProp()) || '' }
        : EMPTY,
      groupContext
        ? fieldControlValidation().getValidationProps
        : fieldControlValidation().getInputValidationProps,
    );
  });
  const computedChecked = () => (isGrouped() ? Boolean(localGroupProps().checked()) : checked());
  const computedIndeterminate = () =>
    isGrouped() ? localGroupProps().indeterminate() || indeterminate() : indeterminate();

  createEffect(() => {
    if (parentContext() && value()) {
      parentContext()?.disabledStatesRef.set(value()!, disabled());
    }
  });

  const state = createMemo<CheckboxRoot.State>(() => ({
    ...fieldState(),
    checked: computedChecked(),
    disabled: disabled(),
    readOnly: readOnly(),
    required: required(),
    indeterminate: computedIndeterminate(),
  }));

  const customStyleHookMapping = useCustomStyleHookMapping(() => state());

  const element = useRenderElement('button', componentProps, {
    state,
    ref: (el) => {
      buttonRef(el);
      setControlRef(el);
      groupContext?.registerControlRef(el);
    },
    customStyleHookMapping,
    props: [
      () => ({
        id: id(),
        role: 'checkbox',
        disabled: disabled(),
        'aria-checked': localGroupProps().indeterminate() ? 'mixed' : checked(),
        'aria-readonly': readOnly() || undefined,
        'aria-required': required() || undefined,
        'aria-labelledby': labelId(),
        [PARENT_CHECKBOX as string]: parent() ? '' : undefined,
        onFocus,
        onBlur,
        onClick,
      }),
      (props) => fieldControlValidation().getValidationProps(props),
      elementProps,
      otherGroupProps,
      getButtonProps,
    ],
  });

  return (
    <CheckboxRootContext.Provider value={state}>
      {element()}
      {!checked() && !groupContext && nameProp() && !parent() && (
        <input type="hidden" name={nameProp()} value="off" />
      )}
      <input
        {...inputProps()}
        ref={(el) => {
          inputRef = el;
          fieldControlValidation().refs.inputRef = el;
        }}
      />
    </CheckboxRootContext.Provider>
  );
}

export namespace CheckboxRoot {
  export interface State extends FieldRoot.State {
    /**
     * Whether the checkbox is currently ticked.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to tick or untick the checkbox.
     */
    readOnly: boolean;
    /**
     * Whether the user must tick the checkbox before submitting a form.
     */
    required: boolean;
    /**
     * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
     */
    indeterminate: boolean;
  }

  export interface Props
    extends Omit<
      BaseUIComponentProps<'button', State>,
      'onChange' | 'value' | 'disabled' | 'name' | 'id'
    > {
    /**
     * The id of the input element.
     */
    id?: MaybeAccessor<string | undefined>;
    /**
     * Identifies the field when a form is submitted.
     * @default undefined
     */
    name?: MaybeAccessor<string | undefined>;
    /**
     * Whether the checkbox is currently ticked.
     *
     * To render an uncontrolled checkbox, use the `defaultChecked` prop instead.
     * @default undefined
     */
    checked?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the checkbox is initially ticked.
     *
     * To render a controlled checkbox, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Event handler called when the checkbox is ticked or unticked.
     *
     * @param {boolean} checked The new checked state.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onCheckedChange?: (checked: boolean, event: Event) => void;
    /**
     * Whether the user should be unable to tick or untick the checkbox.
     * @default false
     */
    readOnly?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the user must tick the checkbox before submitting a form.
     * @default false
     */
    required?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
     * @default false
     */
    indeterminate?: MaybeAccessor<boolean | undefined>;
    /**
     * A ref to access the hidden `<input>` element.
     */
    inputRef?: HTMLInputElement | null | undefined;
    /**
     * Whether the checkbox controls a group of child checkboxes.
     *
     * Must be used in a [Checkbox Group](https://base-ui.com/react/components/checkbox-group).
     * @default false
     */
    parent?: MaybeAccessor<boolean | undefined>;
    /**
     * The value of the selected checkbox.
     */
    value?: MaybeAccessor<string | undefined>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }
}
