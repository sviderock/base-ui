'use client';
import { createEffect, createMemo, on } from 'solid-js';
import { createStore } from 'solid-js/store';
import { access, callEventHandler, splitComponentProps } from '../solid-helpers';
import type { BaseUIComponentProps } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElementV2';
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
  const [formRef, setFormRef] = createStore<FormContext['formRef']>({ fields: {} });
  let submitted = false;

  const focusControl = (control: HTMLElement) => {
    control.focus();
    if (control.tagName === 'INPUT') {
      (control as HTMLInputElement).select();
    }
  };

  const invalidFields = createMemo(() =>
    Object.values(formRef.fields).filter((field) => field.validityData.state.valid === false),
  );

  createEffect(
    on(invalidFields, () => {
      if (!submitted) {
        return;
      }

      submitted = false;

      if (invalidFields().length) {
        const controlRef = access(invalidFields()[0].controlRef);
        focusControl(controlRef);
      }
    }),
  );

  const clearErrors = (name: string | undefined) => {
    const err = local.errors;
    if (name && err && EMPTY.hasOwnProperty.call(err, name)) {
      const nextErrors = { ...err };
      delete nextErrors[name];
      local.onClearErrors?.(nextErrors);
    }
  };

  const contextValue: FormContext = {
    formRef,
    setFormRef,
    errors: () => local.errors ?? {},
    clearErrors,
  };

  const element = useRenderElement('form', componentProps, {
    state: EMPTY,
    props: [
      {
        noValidate: true,
        onSubmit(event) {
          // Async validation isn't supported to stop the submit event.
          Object.values(formRef.fields).forEach((field) => field.validate());

          if (invalidFields().length) {
            event.preventDefault();
            const controlRef = access(invalidFields()[0].controlRef);
            focusControl(controlRef);
          } else {
            submitted = true;
            callEventHandler(local.onSubmit, event);
          }
        },
      },
      elementProps,
    ],
  });

  return <FormContext.Provider value={contextValue}>{element()}</FormContext.Provider>;
}

export namespace Form {
  export interface Props extends BaseUIComponentProps<'form', State> {
    /**
     * An object where the keys correspond to the `name` attribute of the form fields,
     * and the values correspond to the error(s) related to that field.
     */
    errors?: ReturnType<FormContext['errors']>;
    /**
     * Event handler called when the `errors` object is cleared.
     */
    onClearErrors?: (errors: ReturnType<FormContext['errors']>) => void;
  }
  export interface State {}
}
