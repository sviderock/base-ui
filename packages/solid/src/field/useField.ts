import { createEffect, onCleanup } from 'solid-js';
import { reconcile } from 'solid-js/store';
import { useFormContext } from '../form/FormContext';
import { type MaybeAccessor, access } from '../solid-helpers';
import { useFieldRootContext } from './root/FieldRootContext';
import { getCombinedFieldValidityData } from './utils/getCombinedFieldValidityData';

export function useField(params: useField.Parameters) {
  const { formRef, setFormRef } = useFormContext();
  const { invalid, refs, validityData, setValidityData } = useFieldRootContext();
  const enabled = () => access(params.enabled) ?? true;
  const value = () => access(params.value);
  const id = () => access(params.id);
  const name = () => access(params.name);
  const controlRef = () => access(params.controlRef);

  createEffect(() => {
    if (!enabled()) {
      return;
    }

    let initialValue = value();
    if (initialValue === undefined) {
      initialValue = params.getValue?.();
    }

    if (validityData.initialValue === null && initialValue !== validityData.initialValue) {
      setValidityData((prev) => ({ ...prev, initialValue }));
    }
  });

  createEffect(() => {
    if (!enabled()) {
      return;
    }

    const idValue = id();
    if (idValue) {
      setFormRef(
        'fields',
        idValue,
        reconcile({
          controlRef: controlRef(),
          validityData: getCombinedFieldValidityData(validityData, invalid()),
          validate() {
            let nextValue = value();
            if (nextValue === undefined) {
              nextValue = params.getValue?.();
            }
          },
          getValueRef: params.getValue,
          name: name(),
        }),
      );
    }
  });

  createEffect(() => {
    const idValue = id();
    onCleanup(() => {
      if (idValue) {
        setFormRef('fields', idValue, undefined as any);
      }
    });
  });
}

export namespace useField {
  export interface Parameters {
    enabled?: MaybeAccessor<boolean | undefined>;
    value: MaybeAccessor<unknown>;
    getValue?: (() => unknown) | undefined;
    id: MaybeAccessor<string | undefined>;
    name?: MaybeAccessor<string | undefined>;
    commitValidation: (value: unknown) => void;
    /**
     * A ref to a focusable element that receives focus when the field fails
     * validation during form submission.
     */
    controlRef: MaybeAccessor<any>;
  }
}
