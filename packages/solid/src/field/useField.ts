import { createEffect, onCleanup } from 'solid-js';
import { produce } from 'solid-js/store';
import { useFormContext } from '../form/FormContext';
import { type MaybeAccessor, access } from '../solid-helpers';
import { useFieldRootContext } from './root/FieldRootContext';
import { getCombinedFieldValidityData } from './utils/getCombinedFieldValidityData';

export function useField(params: useField.Parameters) {
  const { setFormRef } = useFormContext();
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
      setValidityData('initialValue', initialValue);
    }
  });

  createEffect(() => {
    if (!enabled()) {
      return;
    }

    const idValue = id();
    if (idValue) {
      setFormRef('fields', idValue, {
        controlRef: controlRef(),
        validityData: getCombinedFieldValidityData(validityData, invalid()),
        validate() {
          let nextValue = value();
          if (nextValue === undefined) {
            nextValue = params.getValue?.();
          }
          refs.markedDirtyRef = true;

          // Synchronously update the validity state so the submit event can be prevented.
          params.commitValidation?.(nextValue);
        },
        getValueRef: params.getValue,
        name: name(),
      });
    }
  });

  createEffect(() => {
    const idValue = id();
    onCleanup(() => {
      if (idValue) {
        setFormRef(
          'fields',
          produce((fields) => {
            delete fields[idValue];
          }),
        );
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
