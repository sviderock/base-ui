'use client';
import { createContext, useContext, type Accessor, type Setter } from 'solid-js';
import { type SetStoreFunction, type Store } from 'solid-js/store';
import { NOOP } from '../../utils/noop';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import type { FieldRoot, FieldValidityData } from './FieldRoot';

export interface FieldRootContext {
  invalid: Accessor<boolean | undefined>;
  /**
   * The `id` of the labelable element that corresponds to the `for` attribute of a `Field.Label`.
   * When `null` the association is implicit.
   */
  controlId: Accessor<string | null | undefined>;
  setControlId: Setter<string | null | undefined>;
  labelId: Accessor<string | undefined>;
  setLabelId: Setter<string | undefined>;
  messageIds: Accessor<string[]>;
  setMessageIds: Setter<string[]>;
  name: Accessor<string | undefined>;
  validityData: Store<FieldValidityData>;
  setValidityData: SetStoreFunction<FieldValidityData>;
  disabled: Accessor<boolean | undefined>;
  touched: Accessor<boolean>;
  setTouched: Setter<boolean>;
  dirty: Accessor<boolean>;
  setDirty: Setter<boolean>;
  filled: Accessor<boolean>;
  setFilled: Setter<boolean>;
  focused: Accessor<boolean>;
  setFocused: Setter<boolean>;
  validate: (
    value: unknown,
    formValues: Record<string, unknown>,
  ) => string | string[] | null | Promise<string | string[] | null>;
  validationMode: Accessor<'onBlur' | 'onChange'>;
  validationDebounceTime: Accessor<number>;
  state: Accessor<FieldRoot.State>;
  refs: {
    markedDirtyRef: boolean;
  };
}

export const FieldRootContext = createContext<FieldRootContext>({
  invalid: () => undefined,
  controlId: () => undefined,
  setControlId: NOOP as Setter<any>,
  labelId: () => undefined,
  setLabelId: NOOP as Setter<any>,
  messageIds: () => [],
  setMessageIds: NOOP as Setter<any>,
  name: () => undefined,
  validityData: {
    state: DEFAULT_VALIDITY_STATE,
    errors: [],
    error: '',
    value: '',
    initialValue: null,
  },
  setValidityData: NOOP,
  disabled: () => undefined,
  touched: () => false,
  setTouched: NOOP as Setter<any>,
  dirty: () => false,
  setDirty: NOOP as Setter<any>,
  filled: () => false,
  setFilled: NOOP as Setter<any>,
  focused: () => false,
  setFocused: NOOP as Setter<any>,
  validate: () => null,
  validationMode: () => 'onBlur' as const,
  validationDebounceTime: () => 0,
  state: () => ({
    disabled: false,
    valid: null,
    touched: false,
    dirty: false,
    filled: false,
    focused: false,
  }),
  refs: {
    markedDirtyRef: false,
  },
});

export function useFieldRootContext(optional = true) {
  const context = useContext(FieldRootContext);

  if (context.setControlId === NOOP && !optional) {
    throw new Error(
      'Base UI: FieldRootContext is missing. Field parts must be placed within <Field.Root>.',
    );
  }

  return context;
}
