'use client';
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type ComponentProps,
} from 'solid-js';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useField } from '../../field/useField';
import { useFormContext } from '../../form/FormContext';
import { mergeProps } from '../../merge-props';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { RenderElement } from '../../utils/useRenderElement';
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
  const checkedProp = () => local.checked;
  const defaultChecked = () => access(local.defaultChecked);
  const idProp = () => access(local.id);
  const nativeButton = () => access(local.nativeButton) ?? true;
  const readOnly = () => access(local.readOnly) ?? false;
  const required = () => access(local.required) ?? false;
  const disabledProp = () => access(local.disabled) ?? false;
  const nameProp = () => elementProps.name;

  const { clearErrors } = useFormContext();
  const {
    state: fieldState,
    labelId,
    setControlId,
    setTouched,
    setDirty,
    validityData,
    setFilled,
    setFocused,
    validationMode,
    disabled: fieldDisabled,
    name: fieldName,
  } = useFieldRootContext();

  const disabled = () => fieldDisabled() || disabledProp();
  const name = () => fieldName() ?? access(elementProps.name);

  const {
    getValidationProps,
    getInputValidationProps,
    refs: validationRefs,
    commitValidation,
  } = useFieldControlValidation();

  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null | undefined>(null);
  const [switchRef, setSwitchRef] = createSignal<HTMLButtonElement | null | undefined>(null);

  const id = useBaseUiId(idProp);

  createEffect(() => {
    if (!switchRef()) {
      return;
    }

    if (switchRef()?.closest('label') != null) {
      setControlId(idProp() ?? null);
    } else {
      setControlId(id());
    }

    onCleanup(() => {
      setControlId(undefined);
    });
  });

  const [checked, setCheckedState] = useControlled({
    controlled: checkedProp,
    default: () => Boolean(defaultChecked()),
    name: 'Switch',
    state: 'checked',
  });

  useField({
    id,
    commitValidation,
    value: checked,
    controlRef: switchRef,
    name,
    getValue: checked,
  });

  createEffect(() => {
    if (inputRef()) {
      setFilled(inputRef()!.checked);
    }
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const rootProps = createMemo<ComponentProps<'button'>>(() => ({
    id: id(),
    role: 'switch',
    disabled: disabled(),
    'aria-checked': checked(),
    'aria-readonly': readOnly() || undefined,
    'aria-labelledby': labelId(),
    onFocus() {
      setFocused(true);
    },
    onBlur() {
      const element = inputRef();
      if (!element) {
        return;
      }

      batch(() => {
        setTouched(true);
        setFocused(false);

        if (validationMode() === 'onBlur') {
          commitValidation(element.checked);
        }
      });
    },
    onClick(event) {
      if (event.defaultPrevented || readOnly()) {
        return;
      }

      inputRef()?.click();
    },
  }));

  const inputProps = createMemo(() =>
    mergeProps<'input'>(
      {
        checked: checked(),
        disabled: disabled(),
        id: !name() ? `${id()}-input` : undefined,
        name: name(),
        required: required(),
        style: visuallyHidden,
        tabIndex: -1,
        type: 'checkbox',
        'aria-hidden': true,
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
    ),
  );

  const state = createMemo<SwitchRoot.State>(() => ({
    ...fieldState(),
    checked: checked(),
    disabled: disabled(),
    readOnly: readOnly(),
    required: required(),
  }));

  const context: SwitchRootContext = {
    touched: () => fieldState().touched,
    dirty: () => fieldState().dirty,
    valid: () => fieldState().valid,
    filled: () => fieldState().filled,
    focused: () => fieldState().focused,
    checked,
    disabled,
    readOnly,
    required,
  };

  return (
    <SwitchRootContext.Provider value={context}>
      <RenderElement
        element="button"
        componentProps={componentProps}
        ref={(el) => {
          batch(() => {
            if (typeof componentProps.ref === 'function') {
              componentProps.ref(el);
            } else {
              componentProps.ref = el;
            }
            setSwitchRef(el);
            buttonRef(el);
          });
        }}
        params={{
          state: state(),
          props: [rootProps(), getValidationProps, elementProps, getButtonProps],
          customStyleHookMapping: styleHookMapping,
        }}
      />
      {!checked() && nameProp() && <input type="hidden" name={nameProp()} value="off" />}
      <input
        ref={(el) => {
          if (local.refs) {
            local.refs.inputRef = el;
          }
          setInputRef(el);
          validationRefs.inputRef = el;
        }}
        {...inputProps()}
      />
    </SwitchRootContext.Provider>
  );
}

export namespace SwitchRoot {
  export interface Props
    extends Omit<BaseUIComponentProps<'button', SwitchRoot.State>, 'onChange' | 'id' | 'disabled'> {
    /**
     * The id of the switch element.
     */
    id?: MaybeAccessor<string | undefined>;
    /**
     * Whether the switch is currently active.
     *
     * To render an uncontrolled switch, use the `defaultChecked` prop instead.
     */
    checked?: boolean | undefined;
    /**
     * Whether the switch is initially active.
     *
     * To render a controlled switch, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    refs?: {
      /**
       * A ref to access the hidden `<input>` element.
       */
      inputRef?: HTMLInputElement | null | undefined;
    };
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string | undefined;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
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
    readOnly?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the user must activate the switch before submitting a form.
     * @default false
     */
    required?: MaybeAccessor<boolean | undefined>;
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
