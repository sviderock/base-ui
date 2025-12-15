'use client';
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  Show,
  type Accessor,
  type ComponentProps,
} from 'solid-js';
import { ACTIVE_COMPOSITE_ITEM } from '../../composite/constants';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useRadioGroupContext } from '../../radio-group/RadioGroupContext';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { NOOP } from '../../utils/noop';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { customStyleHookMapping } from '../utils/customStyleHookMapping';
import { RadioRootContext } from './RadioRootContext';

/**
 * Represents the radio button itself.
 * Renders a `<button>` element and a hidden `<input>` beside.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
export function RadioRoot(componentProps: RadioRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'readOnly',
    'required',
    'value',
    'refs',
    'nativeButton',
  ]);

  const disabledProp = () => access(local.disabled) ?? false;
  const readOnlyProp = () => access(local.readOnly) ?? false;
  const requiredProp = () => access(local.required) ?? false;
  const value = () => access(local.value);
  const nativeButton = () => access(local.nativeButton) ?? true;

  const {
    disabled: disabledRoot,
    readOnly: readOnlyRoot,
    required: requiredRoot,
    checkedValue,
    setCheckedValue,
    onValueChange,
    touched,
    setTouched,
    fieldControlValidation,
    registerControlRef,
  } = useRadioGroupContext();

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();

  const disabled = () => fieldDisabled() || disabledRoot() || disabledProp();
  const readOnly = () => readOnlyRoot() || readOnlyProp();
  const required = () => requiredRoot() || requiredProp();

  const { setDirty, validityData, setTouched: setFieldTouched, setFilled } = useFieldRootContext();

  const checked = () => checkedValue() === value();

  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null | undefined>(null);

  const rootProps = createMemo<ComponentProps<'button'>>(() => ({
    role: 'radio',
    'aria-checked': checked(),
    'aria-required': required() || undefined,
    'aria-disabled': disabled() || undefined,
    'aria-readonly': readOnly() || undefined,
    [ACTIVE_COMPOSITE_ITEM as string]: checked() ? '' : undefined,
    disabled: disabled(),
    onKeyDown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    },
    onClick(event) {
      if (event.defaultPrevented || disabled() || readOnly()) {
        return;
      }

      event.preventDefault();

      inputRef()?.click();
    },
    onFocus(event) {
      if (event.defaultPrevented || disabled() || readOnly() || !touched()) {
        return;
      }

      inputRef()?.click();

      setTouched(false);
    },
  }));

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const id = useBaseUiId();

  createEffect(() => {
    if (checked()) {
      setFilled(true);
    }
  });

  const inputProps = createMemo<ComponentProps<'input'>>(() => ({
    type: 'radio',
    // Set `id` to stop Chrome warning about an unassociated input
    id: id(),
    tabIndex: -1,
    style: visuallyHidden,
    'aria-hidden': true,
    disabled: disabled(),
    checked: checked(),
    required: required(),
    readOnly: readOnly(),
    onChange(event) {
      // Workaround for https://github.com/facebook/react/issues/9023
      if (event.defaultPrevented) {
        return;
      }

      if (disabled() || readOnly() || value() === undefined) {
        return;
      }

      setFieldTouched(true);
      setDirty(value() !== validityData.initialValue);
      setCheckedValue(value());
      setFilled(true);
      onValueChange?.(value(), event);
    },
  }));

  const state = createMemo<RadioRoot.State>(() => ({
    ...fieldState(),
    required: required(),
    disabled: disabled(),
    readOnly: readOnly(),
    checked: checked(),
  }));

  const context: RadioRootContext = {
    dirty: () => fieldState().dirty,
    valid: () => fieldState().valid,
    filled: () => fieldState().filled,
    focused: () => fieldState().focused,
    disabled,
    touched,
    readOnly,
    checked,
    required,
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: (el) => {
      batch(() => {
        registerControlRef(el);
        buttonRef(el);
      });
    },
    customStyleHookMapping,
    props: [
      rootProps,
      (p) => fieldControlValidation?.getValidationProps(p),
      elementProps,
      getButtonProps,
    ],
  });

  return (
    <RadioRootContext.Provider value={context}>
      <Show when={setCheckedValue !== NOOP} fallback={element()}>
        <CompositeItem render={element} />
      </Show>

      <input
        ref={(el) => {
          if (local.refs) {
            local.refs.inputRef = el;
          }
          setInputRef(el);
        }}
        {...inputProps()}
      />
    </RadioRootContext.Provider>
  );
}

export namespace RadioRoot {
  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'value' | 'disabled'> {
    /**
     * The unique identifying value of the radio in a group.
     */
    value: MaybeAccessor<any>;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the user should be unable to select the radio button.
     * @default false
     */
    readOnly?: MaybeAccessor<boolean | undefined>;
    refs?: {
      /**
       * A ref to access the hidden input element.
       */
      inputRef?: HTMLInputElement | null | undefined;
    };
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }

  export interface State extends FieldRoot.State {
    /**
     * Whether the radio button is currently selected.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the user should be unable to select the radio button.
     */
    readOnly: boolean;
    /**
     * Whether the user must choose a value before submitting a form.
     */
    required: boolean;
  }
}
