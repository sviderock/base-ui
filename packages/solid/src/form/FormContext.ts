'use client';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { FieldValidityData } from '../field/root/FieldRoot';
import type { MaybeAccessor } from '../solid-helpers';
import { NOOP } from '../utils/noop';

export type Errors = Record<string, string | string[]>;

type FormRef = {
  fields: Record<
    string,
    {
      name: string | undefined;
      validate: () => void;
      validityData: FieldValidityData;
      controlRef: MaybeAccessor<HTMLElement>;
      getValueRef: (() => unknown) | undefined;
    }
  >;
};

export interface FormContext {
  errors: Accessor<Errors>;
  clearErrors: (name: string | undefined) => void;
  formRef: Store<FormRef>;
  setFormRef: SetStoreFunction<FormRef>;
}

export const FormContext = createContext<FormContext>({
  formRef: {
    fields: {},
  },
  setFormRef: NOOP,
  errors: () => ({}),
  clearErrors: NOOP,
});

export function useFormContext() {
  return useContext(FormContext);
}
