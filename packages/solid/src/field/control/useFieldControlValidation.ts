'use client';
import { useFormContext } from '../../form/FormContext';
import { mergeProps } from '../../merge-props';
import type { HTMLProps } from '../../utils/types';
import { useTimeout } from '../../utils/useTimeout';
import { useFieldRootContext } from '../root/FieldRootContext';
import { DEFAULT_VALIDITY_STATE } from '../utils/constants';
import { getCombinedFieldValidityData } from '../utils/getCombinedFieldValidityData';

const validityKeys = Object.keys(DEFAULT_VALIDITY_STATE) as Array<keyof ValidityState>;

function isOnlyValueMissing(state: Record<keyof ValidityState, boolean> | undefined) {
  if (!state || state.valid || !state.valueMissing) {
    return false;
  }

  let onlyValueMissing = false;

  for (const key of validityKeys) {
    if (key === 'valid') {
      continue;
    }
    if (key === 'valueMissing') {
      onlyValueMissing = state[key];
    }
    if (state[key]) {
      onlyValueMissing = false;
    }
  }

  return onlyValueMissing;
}

export function useFieldControlValidation() {
  const {
    setValidityData,
    validate,
    messageIds,
    validityData,
    validationMode,
    validationDebounceTime,
    invalid,
    refs: fieldRootRefs,
    controlId,
    state,
    name,
  } = useFieldRootContext();

  const { formRef, clearErrors } = useFormContext();

  const timeout = useTimeout();
  const refs: useFieldControlValidation.ReturnValue['refs'] = {
    inputRef: null,
  };

  const commitValidation = async (value: unknown, revalidate = false) => {
    const element = refs.inputRef;
    if (!element) {
      return;
    }
    console.log('COMMITTING VALIDATION', { value, element: element.value });

    if (revalidate) {
      if (state().valid !== false) {
        return;
      }

      const currentNativeValidity = element.validity;

      if (!currentNativeValidity.valueMissing) {
        // The 'valueMissing' (required) condition has been resolved by the user typing.
        // Temporarily mark the field as valid for this onChange event.
        // Other native errors (e.g., typeMismatch) will be caught by full validation on blur or submit.
        const nextValidityData = {
          value,
          state: { ...DEFAULT_VALIDITY_STATE, valid: true },
          error: '',
          errors: [],
          initialValue: validityData.initialValue,
        };
        element.setCustomValidity('');

        const controlIdValue = controlId();
        if (controlIdValue) {
          const currentFieldData = formRef.fields.get(controlIdValue);
          if (currentFieldData) {
            console.log(9, 'SETTING FIELD', currentFieldData, nextValidityData);
            formRef.fields.set(controlIdValue, {
              ...currentFieldData,
              ...getCombinedFieldValidityData(nextValidityData, false), // invalid = false
            });
          }
        }
        setValidityData(nextValidityData);
        return;
      }

      // Value is still missing, or other conditions apply.
      // Let's use a representation of current validity for isOnlyValueMissing.
      const currentNativeValidityObject = validityKeys.reduce(
        (acc, key) => {
          acc[key] = currentNativeValidity[key];
          return acc;
        },
        {} as Record<keyof ValidityState, boolean>,
      );

      // If it's (still) natively invalid due to something other than just valueMissing,
      // then bail from this revalidation on change to avoid "scolding" for other errors.
      if (!currentNativeValidityObject.valid && !isOnlyValueMissing(currentNativeValidityObject)) {
        return;
      }

      // If valueMissing is still true AND it's the only issue, or if the field is now natively valid,
      // let it fall through to the main validation logic below.
    }

    function getState(el: HTMLInputElement) {
      console.log('getState', { el: el.outerHTML });
      const computedState = validityKeys.reduce(
        (acc, key) => {
          acc[key] = el.validity[key];
          return acc;
        },
        {} as Record<keyof ValidityState, boolean>,
      );

      let hasOnlyValueMissingError = false;

      for (const key of validityKeys) {
        if (key === 'valid') {
          continue;
        }
        if (key === 'valueMissing' && computedState[key]) {
          hasOnlyValueMissingError = true;
        } else if (computedState[key]) {
          return computedState;
        }
      }

      // Only make `valueMissing` mark the field invalid if it's been changed
      // to reduce error noise.
      if (hasOnlyValueMissingError && !fieldRootRefs.markedDirtyRef) {
        computedState.valid = true;
        computedState.valueMissing = false;
      }
      return computedState;
    }

    timeout.clear();

    let result: null | string | string[] = null;
    let validationErrors: string[] = [];

    const nextState = getState(element);
    console.log('PRE NEXT STATE', nextState);

    let defaultValidationMessage;

    if (element.validationMessage) {
      defaultValidationMessage = element.validationMessage;
      validationErrors = [element.validationMessage];
    } else {
      const formValues = Array.from(formRef.fields.values()).reduce(
        (acc, field) => {
          if (field.name && field.getValueRef) {
            acc[field.name] = field.getValueRef();
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

      const resultOrPromise = validate(value, formValues);
      if (
        typeof resultOrPromise === 'object' &&
        resultOrPromise !== null &&
        'then' in resultOrPromise
      ) {
        result = await resultOrPromise;
      } else {
        result = resultOrPromise;
      }

      if (result !== null) {
        nextState.valid = false;
        nextState.customError = true;

        if (Array.isArray(result)) {
          validationErrors = result;
          element.setCustomValidity(result.join('\n'));
        } else if (result) {
          validationErrors = [result];
          element.setCustomValidity(result);
        }
      }
    }

    console.log('POST NEXT STATE', nextState);

    const nextValidityData = {
      value,
      state: nextState,
      error: defaultValidationMessage ?? (Array.isArray(result) ? result[0] : (result ?? '')),
      errors: validationErrors,
      initialValue: validityData.initialValue,
    };

    const controlIdValue = controlId();
    if (controlIdValue) {
      const currentFieldData = formRef.fields.get(controlIdValue);
      if (currentFieldData) {
        const combined = getCombinedFieldValidityData(nextValidityData, invalid());
        console.log('COMMIT VALIDATION SETTING FIELD', {
          controlId: controlIdValue,
          nextValidityData,
          invalid: invalid(),
          combined,
        });
        formRef.fields.set(controlIdValue, {
          ...currentFieldData,
          ...combined,
        });
      }
    }

    setValidityData(nextValidityData);
  };

  const getValidationProps = (externalProps = {}) => {
    return mergeProps<any>(
      {
        ...(messageIds().length && { 'aria-describedby': messageIds().join(' ') }),
        ...(state().valid === false && { 'aria-invalid': true }),
      },
      externalProps,
    );
  };

  const getInputValidationProps = (externalProps = {}) =>
    mergeProps<'input'>(
      {
        onChange(event) {
          // Workaround for https://github.com/facebook/react/issues/9023
          if (event.defaultPrevented) {
            return;
          }

          clearErrors(name());

          if (validationMode() !== 'onChange') {
            commitValidation(event.currentTarget.value, true);
            return;
          }

          if (invalid()) {
            return;
          }

          const element = event.currentTarget;

          if (element.value === '') {
            // Ignore the debounce time for empty values.
            commitValidation(element.value);
            return;
          }

          timeout.clear();

          if (validationDebounceTime()) {
            timeout.start(validationDebounceTime(), () => {
              commitValidation(element.value);
            });
          } else {
            commitValidation(element.value);
          }
        },
      },
      getValidationProps(externalProps),
    );

  return {
    getValidationProps,
    getInputValidationProps,
    refs,
    commitValidation,
  };
}

export namespace useFieldControlValidation {
  export interface ReturnValue {
    getValidationProps: (props?: HTMLProps) => HTMLProps;
    getInputValidationProps: (props?: HTMLProps) => HTMLProps;
    refs: {
      inputRef: any;
    };
    commitValidation: (value: unknown, revalidate?: boolean) => void;
  }
}
