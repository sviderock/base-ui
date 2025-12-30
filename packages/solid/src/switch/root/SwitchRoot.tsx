'use client';
import { batch, createSignal, onMount, mergeProps as solidMergeProps, type JSX } from 'solid-js';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useField } from '../../field/useField';
import { useFormContext } from '../../form/FormContext';
import { mergeProps } from '../../merge-props';
import { access, splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useRenderElement } from '../../utils/useRenderElement';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { styleHookMapping } from '../styleHooks';
import { SwitchRootContext } from './SwitchRootContext';
/**
 * Represents the switch itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export function SwitchRoot(componentProps: SwitchRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'checked',
    'defaultChecked',
    'id',
    'refs',
    'nativeButton',
    'onCheckedChange',
    'readOnly',
    'required',
    'disabled',
  ]);
  const nativeButton = () => local.nativeButton ?? true;
  const readOnly = () => local.readOnly ?? false;
  const required = () => local.required ?? false;
  const disabledProp = () => local.disabled ?? false;

  const { clearErrors } = useFormContext();
  const {
    state: fieldState,
    labelId,
    setTouched,
    setDirty,
    validityData,
    setFilled,
    setFocused,
    validationMode,
    disabled: fieldDisabled,
    name: fieldName,
    setCodependentRefs: setChildRefs,
  } = useFieldRootContext();

  const disabled = () => fieldDisabled() || disabledProp();
  const name = () => fieldName() ?? access(elementProps.name);

  const {
    getValidationProps,
    getInputValidationProps,
    refs: validationRefs,
    commitValidation,
  } = useFieldControlValidation();

  let inputRef = null as HTMLInputElement | null | undefined;
  const [switchRef, setSwitchRef] = createSignal<HTMLButtonElement | undefined>();

  const id = useBaseUiId(() => local.id);

  onMount(() => {
    setChildRefs('control', { explicitId: id, ref: switchRef, id: () => local.id });

    if (inputRef) {
      setFilled(inputRef!.checked);
    }
  });

  const [checked, setCheckedState] = useControlled({
    controlled: () => local.checked,
    default: () => Boolean(local.defaultChecked),
    name: 'Switch',
    state: 'checked',
  });

  useField({
    id,
    commitValidation,
    value: checked,
    controlRef: () => switchRef,
    name,
    getValue: checked,
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const rootProps: JSX.HTMLAttributes<HTMLButtonElement> = {
    role: 'switch',
    get id() {
      return id();
    },
    // @ts-expect-error - disabled is not a valid attribute for a button
    get disabled() {
      return disabled();
    },
    get 'aria-checked'() {
      return checked();
    },
    get 'aria-readonly'() {
      return readOnly() || undefined;
    },
    get 'aria-labelledby'() {
      return labelId();
    },
    onFocus() {
      setFocused(true);
    },
    onBlur() {
      if (!inputRef) {
        return;
      }

      batch(() => {
        setTouched(true);
        setFocused(false);

        if (validationMode() === 'onBlur') {
          commitValidation(inputRef!.checked);
        }
      });
    },
    onClick(event) {
      if (event.defaultPrevented || readOnly()) {
        return;
      }

      inputRef?.click();
    },
  };

  const inputProps = mergeProps<'input'>(
    {
      get checked() {
        return checked();
      },
      get disabled() {
        return disabled();
      },
      get id() {
        return !name() ? `${id()}-input` : undefined;
      },
      get name() {
        return name();
      },
      get required() {
        return required();
      },
      style: visuallyHidden,
      tabIndex: -1,
      type: 'checkbox',
      'aria-hidden': true,
      ref: (el) => {
        if (local.refs) {
          local.refs.inputRef = el;
        }
        inputRef = el;
        validationRefs.inputRef = el;
      },
      onInput(event) {
        // Workaround for https://github.com/facebook/react/issues/9023
        if (event.defaultPrevented) {
          return;
        }

        batch(() => {
          const nextChecked = event.target.checked;

          setDirty(nextChecked !== validityData.initialValue);
          setFilled(nextChecked);
          setCheckedState(nextChecked);
          local.onCheckedChange?.(nextChecked, event);
          clearErrors(name());

          if (validationMode() === 'onChange') {
            commitValidation(nextChecked);
          } else {
            commitValidation(nextChecked, true);
          }
        });
      },
    },
    getInputValidationProps,
  );

  const state: SwitchRoot.State = solidMergeProps(fieldState, {
    get disabled() {
      return disabled();
    },
    get checked() {
      return checked();
    },
    get readOnly() {
      return readOnly();
    },
    get required() {
      return required();
    },
  });

  const context: SwitchRootContext = {
    touched: () => fieldState.touched,
    dirty: () => fieldState.dirty,
    valid: () => fieldState.valid,
    filled: () => fieldState.filled,
    focused: () => fieldState.focused,
    checked,
    disabled,
    readOnly,
    required,
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: (el) => {
      setSwitchRef(el);
      buttonRef(el);
    },
    props: [rootProps, getValidationProps, elementProps, getButtonProps],
    customStyleHookMapping: styleHookMapping,
  });

  return (
    <SwitchRootContext.Provider value={context}>
      {element()}
      {!checked() && elementProps.name && (
        <input type="hidden" name={elementProps.name} value="off" />
      )}
      <input {...(inputProps as any)} />
    </SwitchRootContext.Provider>
  );
}

export namespace SwitchRoot {
  export interface Props
    extends Omit<BaseUIComponentProps<'button', SwitchRoot.State>, 'onChange'> {
    /**
     * Whether the switch is currently active.
     *
     * To render an uncontrolled switch, use the `defaultChecked` prop instead.
     */
    checked?: boolean;
    /**
     * Whether the switch is initially active.
     *
     * To render a controlled switch, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: boolean;
    refs?: {
      /**
       * A ref to access the hidden `<input>` element.
       */
      inputRef?: HTMLInputElement | null | undefined;
    };
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
    /**
     * Event handler called when the switch is activated or deactivated.
     *
     * @param {boolean} checked The new checked state.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onCheckedChange?: (checked: boolean, event: Event) => void;
    /**
     * Whether the user should be unable to activate or deactivate the switch.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the user must activate the switch before submitting a form.
     * @default false
     */
    required?: boolean;
  }

  export interface State extends FieldRoot.State {
    /**
     * Whether the switch is currently active.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to activate or deactivate the switch.
     */
    readOnly: boolean;
    /**
     * Whether the user must activate the switch before submitting a form.
     */
    required: boolean;
  }
}
