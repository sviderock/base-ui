import { createContext, useContext, type Accessor } from 'solid-js';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';

export interface CheckboxGroupContext {
  value: Accessor<string[] | undefined>;
  defaultValue: Accessor<string[] | undefined>;
  setValue: (value: string[], event: Event) => void;
  allValues: Accessor<string[] | undefined>;
  parent: useCheckboxGroupParent.ReturnValue;
  disabled: Accessor<boolean>;
  fieldControlValidation: useFieldControlValidation.ReturnValue;
  registerControlRef: (element: HTMLButtonElement | null | undefined) => void;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContext>();

export function useCheckboxGroupContext(optional: false): CheckboxGroupContext;
export function useCheckboxGroupContext(optional?: true): CheckboxGroupContext | undefined;
export function useCheckboxGroupContext(optional = true) {
  const context = useContext(CheckboxGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: CheckboxGroupContext is missing. CheckboxGroup parts must be placed within <CheckboxGroup>.',
    );
  }

  return context;
}
