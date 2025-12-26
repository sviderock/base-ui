'use client';
import { batch, mergeProps } from 'solid-js';
import { PARENT_CHECKBOX } from '../checkbox/root/CheckboxRoot';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import type { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { useField } from '../field/useField';
import { fieldValidityMapping } from '../field/utils/constants';
import { splitComponentProps } from '../solid-helpers';
import type { BaseUIComponentProps } from '../utils/types';
import { useBaseUiId } from '../utils/useBaseUiId';
import { useControlled } from '../utils/useControlled';
import { useRenderElement } from '../utils/useRenderElementV2';
import { CheckboxGroupContext } from './CheckboxGroupContext';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';

/**
 * Provides a shared state to a series of checkboxes.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
export function CheckboxGroup(componentProps: CheckboxGroup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'allValues',
    'defaultValue',
    'disabled',
    'id',
    'onValueChange',
    'render',
    'value',
  ]);

  const {
    disabled: fieldDisabled,
    labelId,
    name: fieldName,
    state: fieldState,
  } = useFieldRootContext();

  const disabled = () => fieldDisabled() || (local.disabled ?? false);

  const fieldControlValidation = useFieldControlValidation();

  const [value, setValueUnwrapped] = useControlled({
    controlled: () => local.value,
    default: () => local.defaultValue,
    name: 'CheckboxGroup',
    state: 'value',
  });

  const setValue = (v: string[], event: Event) => {
    batch(() => {
      setValueUnwrapped(v);
      local.onValueChange?.(v, event);
    });
  };

  const parent = useCheckboxGroupParent({
    allValues: () => local.allValues,
    value: () => local.value,
    onValueChange: (...args) => {
      local.onValueChange?.(...args);
    },
  });

  const id = useBaseUiId(() => local.id);

  let controlRef: HTMLButtonElement | null | undefined = null;
  const registerControlRef = (element: HTMLButtonElement | null | undefined) => {
    if (controlRef == null && element != null && !element.hasAttribute(PARENT_CHECKBOX)) {
      controlRef = element;
    }
  };

  useField({
    enabled: () => !!fieldName(),
    id,
    commitValidation: fieldControlValidation.commitValidation,
    value,
    controlRef: () => controlRef,
    name: fieldName,
    getValue: value,
  });

  const contextValue: CheckboxGroupContext = {
    allValues: () => local.allValues,
    value,
    defaultValue: () => local.defaultValue,
    setValue,
    parent,
    disabled,
    fieldControlValidation,
    registerControlRef,
  };

  const state: CheckboxGroup.State = mergeProps(fieldState, {
    get disabled() {
      return disabled();
    },
  });

  const element = useRenderElement('div', componentProps, {
    state,
    customStyleHookMapping: fieldValidityMapping,
    props: [
      {
        get role() {
          return 'group' as const;
        },
        get 'aria-labelledby'() {
          return labelId();
        },
      },
      elementProps,
    ],
  });

  return (
    <CheckboxGroupContext.Provider value={contextValue}>{element()}</CheckboxGroupContext.Provider>
  );
}

export namespace CheckboxGroup {
  export interface State extends FieldRoot.State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Names of the checkboxes in the group that should be ticked.
     *
     * To render an uncontrolled checkbox group, use the `defaultValue` prop instead.
     */
    value?: string[];
    /**
     * Names of the checkboxes in the group that should be initially ticked.
     *
     * To render a controlled checkbox group, use the `value` prop instead.
     */
    defaultValue?: string[];
    /**
     * Event handler called when a checkbox in the group is ticked or unticked.
     * Provides the new value as an argument.
     */
    onValueChange?: (value: string[], event: Event) => void;
    /**
     * Names of all checkboxes in the group. Use this when creating a parent checkbox.
     */
    allValues?: string[];
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
