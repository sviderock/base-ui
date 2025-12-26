'use client';
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onMount,
  splitProps,
} from 'solid-js';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useField } from '../../field/useField';
import { useFormContext } from '../../form/FormContext';
import { combineProps } from '../../merge-props';
import { splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import type { BaseUIComponentProps, BaseUIHTMLProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useCustomStyleHookMapping } from '../utils/useCustomStyleHookMapping';
import { CheckboxRootContext } from './CheckboxRootContext';

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
  const checkedProp = () => local.checked;
  const defaultChecked = () => local.defaultChecked ?? false;
  const disabledProp = () => local.disabled ?? false;
  const indeterminate = () => local.indeterminate ?? false;
  const parent = () => local.parent ?? false;
  const readOnly = () => local.readOnly ?? false;
  const required = () => local.required ?? false;
  const nativeButton = () => local.nativeButton ?? true;

  const { clearErrors } = useFormContext();
  const {
    disabled: fieldDisabled,
    labelId,
    name: fieldName,
    setDirty,
    setFilled,
    setFocused,
    setTouched,
    state: fieldState,
    validationMode,
    validityData,
    setCodependentRefs: setChildRefs,
  } = useFieldRootContext();

  const groupContext = useCheckboxGroupContext();
  const parentContext = () => groupContext?.parent;
  const isGrouped = createMemo(() => parentContext() && groupContext?.allValues());

  const disabled = () => fieldDisabled() || groupContext?.disabled() || disabledProp();
  const name = () => fieldName() ?? local.name;
  const value = () => local.value ?? name();

  const groupProps = createMemo(() => {
    let mainProps = {} as Partial<Omit<CheckboxRoot.Props, 'class'>>;
    if (isGrouped()) {
      if (parent()) {
        mainProps = groupContext!.parent.getParentProps();
      }

      if (value()) {
        mainProps = groupContext!.parent.getChildProps(value()!);
      }
    }

    const [localGroup, otherGorup] = splitProps(mainProps, [
      'checked',
      'indeterminate',
      'onCheckedChange',
    ]);
    return {
      other: otherGorup,
      local: {
        get checked() {
          return localGroup.checked ?? checkedProp();
        },
        get indeterminate() {
          return localGroup.indeterminate ?? indeterminate();
        },
        // eslint-disable-next-line solid/reactivity
        onCheckedChange: localGroup.onCheckedChange,
      },
    };
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
        : groupProps().local.checked,
    default: () =>
      value() && defaultGroupValue() && !parent()
        ? defaultGroupValue()!.includes(value()!)
        : defaultChecked(),
    name: 'Checkbox',
    state: 'checked',
  });

  const id = useBaseUiId(local.id);

  onMount(() => {
    setChildRefs('control', { explicitId: id, ref: controlRef, id: () => local.id });
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
      inputRef.indeterminate = groupProps().local.indeterminate;
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

  const inputProps = createMemo<BaseUIHTMLProps<HTMLInputElement>>(() => {
    return combineProps<'input'>(
      {
        get checked() {
          return checked();
        },
        get disabled() {
          return disabled();
        },
        // parent checkboxes unset `name` to be excluded from form submission
        get name() {
          return parent() ? undefined : name();
        },
        // Set `id` to stop Chrome warning about an unassociated input
        get id() {
          return `${id()}-input`;
        },
        get required() {
          return required();
        },
        ref: (el) => {
          inputRef = el;
          fieldControlValidation().refs.inputRef = el;
        },
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
            groupProps().local.onCheckedChange?.(nextChecked, event);
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
        // React <19 sets an empty value if `undefined` is passed explicitly
        // To avoid this, we only set the value if it's defined
        get value() {
          return local.value !== undefined
            ? (groupContext ? checked() && local.value : local.value) || ''
            : undefined;
        },
      },

      groupContext
        ? fieldControlValidation().getValidationProps
        : fieldControlValidation().getInputValidationProps,
    );
  });
  const computedChecked = () => (isGrouped() ? Boolean(groupProps().local.checked) : checked());
  const computedIndeterminate = () =>
    isGrouped() ? groupProps().local.indeterminate || indeterminate() : indeterminate();

  createEffect(() => {
    if (parentContext() && value()) {
      parentContext()?.disabledStatesRef.set(value()!, disabled());
    }
  });

  const state: CheckboxRoot.State = mergeProps(fieldState, {
    get disabled() {
      return disabled();
    },
    get checked() {
      return computedChecked();
    },
    get readOnly() {
      return readOnly();
    },
    get required() {
      return required();
    },
    get indeterminate() {
      return computedIndeterminate();
    },
  });

  const customStyleHookMapping = useCustomStyleHookMapping(state);

  const element = useRenderElement('button', componentProps, {
    state,
    ref: (el) => {
      buttonRef(el);
      setControlRef(el);
      groupContext?.registerControlRef(el);
    },
    customStyleHookMapping,
    props: [
      {
        get id() {
          return id();
        },
        role: 'checkbox',
        get disabled() {
          return disabled();
        },
        get 'aria-checked'() {
          return groupProps().local.indeterminate ? 'mixed' : checked();
        },
        get 'aria-readonly'() {
          return readOnly() || undefined;
        },
        get 'aria-required'() {
          return required() || undefined;
        },
        get 'aria-labelledby'() {
          return labelId();
        },
        get [PARENT_CHECKBOX as string]() {
          return parent() ? '' : undefined;
        },
        onFocus,
        onBlur,
        onClick,
      },
      (props) => fieldControlValidation().getValidationProps(props),
      elementProps,
      (props) => combineProps(props, groupProps().other),
      getButtonProps,
    ],
  });

  return (
    <CheckboxRootContext.Provider value={state}>
      {element()}
      {!checked() && !groupContext && local.name && !parent() && (
        <input type="hidden" name={local.name} value="off" />
      )}
      <input {...(inputProps() as any)} />
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

  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'onChange'> {
    /**
     * Whether the checkbox is currently ticked.
     *
     * To render an uncontrolled checkbox, use the `defaultChecked` prop instead.
     * @default undefined
     */
    checked?: boolean;
    /**
     * Whether the checkbox is initially ticked.
     *
     * To render a controlled checkbox, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: boolean;
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
    readOnly?: boolean;
    /**
     * Whether the user must tick the checkbox before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
     * @default false
     */
    indeterminate?: boolean;
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
    parent?: boolean;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
