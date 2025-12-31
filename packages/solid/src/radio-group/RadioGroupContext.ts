import { createContext, useContext, type Accessor } from 'solid-js';
import { useFieldControlValidation } from '../field/control/useFieldControlValidation';
import { NOOP } from '../utils/noop';

export interface RadioGroupContext {
  disabled: Accessor<boolean | undefined>;
  readOnly: Accessor<boolean | undefined>;
  required: Accessor<boolean | undefined>;
  name: Accessor<string | undefined>;
  checkedValue: Accessor<unknown>;
  setCheckedValue: (value: unknown) => void;
  onValueChange: (value: unknown, event: Event) => void;
  touched: Accessor<boolean>;
  setTouched: (value: boolean) => void;
  fieldControlValidation?: ReturnType<typeof useFieldControlValidation>;
  registerControlRef: (element: HTMLElement | null | undefined) => void;
}

export const RadioGroupContext = createContext<RadioGroupContext>({
  disabled: () => undefined,
  readOnly: () => undefined,
  required: () => undefined,
  name: () => undefined,
  checkedValue: () => '',
  setCheckedValue: NOOP,
  onValueChange: NOOP,
  touched: () => false,
  setTouched: NOOP,
  registerControlRef: NOOP,
});

export function useRadioGroupContext() {
  return useContext(RadioGroupContext);
}
