'use client';
import { createEffect, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import {
  access,
  callEventHandler,
  splitComponentProps,
  type MaybeAccessor,
} from '../solid-helpers';
import type { BaseUIComponentProps } from '../utils/types';
import { RenderElement } from '../utils/useRenderElement';
import { FormContext } from './FormContext';

const EMPTY = {};

/**
 * A native form element with consolidated error handling.
 * Renders a `<form>` element.
 *
 * Documentation: [Base UI Form](https://base-ui.com/react/components/form)
 */
export function Form(componentProps: Form.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'errors',
    'onClearErrors',
    'onSubmit',
  ]);
  const errors = () => access(local.errors);
  const [formRef, setFormRef] = createStore<FormContext['formRef']>({ fields: {} });

  const [submitted, setSubmitted] = createSignal(false);

  const focusControl = (control: HTMLElement) => {
    control.focus();
    if (control.tagName === 'INPUT') {
      (control as HTMLInputElement).select();
    }
  };

  createEffect(() => {
    if (!submitted()) {
      return;
    }

    const invalidFields = Object.values(formRef.fields).filter((field) => {
      return field.validityData.state.valid === false;
    });

    if (invalidFields.length) {
      const controlRef = access(invalidFields[0].controlRef);
      focusControl(controlRef);
    }

    setSubmitted(false);
  });

  const clearErrors = (name: string | undefined) => {
    const err = errors();
    if (name && err && EMPTY.hasOwnProperty.call(err, name)) {
      const nextErrors = { ...err };
      delete nextErrors[name];
      local.onClearErrors?.(nextErrors);
    }
  };

  const contextValue: FormContext = {
    formRef,
    setFormRef,
    errors: () => errors() ?? {},
    clearErrors,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <RenderElement
        element="form"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{
          state: EMPTY,
          props: [
            {
              novalidate: true,
              onSubmit(event) {
                console.log('onSubmit');
                let values = Object.values(formRef.fields);
                console.log('VALUES', values);

                // Async validation isn't supported to stop the submit event.
                values.forEach((field) => {
                  field.validate();
                });

                console.log('VALUES AFTER VALIDATE', values);

                values = Object.values(formRef.fields);
                const invalidFields = values.filter((field) => !field.validityData.state.valid);

                console.log('INVALID FIELDS', invalidFields);

                if (invalidFields.length) {
                  console.log('FOCUSING');
                  event.preventDefault();
                  const controlRef = access(invalidFields[0].controlRef);
                  focusControl(controlRef);
                } else {
                  console.log('SUBMITTING');
                  setSubmitted(true);
                  callEventHandler(local.onSubmit, event);
                }
              },
            },
            elementProps,
          ],
        }}
      />
    </FormContext.Provider>
  );
}

export namespace Form {
  export interface Props extends BaseUIComponentProps<'form', State> {
    /**
     * An object where the keys correspond to the `name` attribute of the form fields,
     * and the values correspond to the error(s) related to that field.
     */
    errors?: MaybeAccessor<ReturnType<FormContext['errors']> | undefined>;
    /**
     * Event handler called when the `errors` object is cleared.
     */
    onClearErrors?: (errors: ReturnType<FormContext['errors']>) => void;
  }
  export interface State {}
}
