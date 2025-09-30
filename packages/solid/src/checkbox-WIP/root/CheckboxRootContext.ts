'use client';
import { createContext, useContext } from 'solid-js';
import type { CheckboxRoot } from './CheckboxRoot';

export type CheckboxRootContext = CheckboxRoot.State;

export const CheckboxRootContext = createContext<CheckboxRootContext | undefined>(undefined);

export function useCheckboxRootContext() {
  const context = useContext(CheckboxRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: CheckboxRootContext is missing. Checkbox parts must be placed within <Checkbox.Root>.',
    );
  }

  return context;
}
