'use client';
import { createMemo, type JSX } from 'solid-js';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { access } from '../../solid-helpers';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { serializeValue } from '../utils/serialize';
import { SelectFloatingContext, SelectRootContext } from './SelectRootContext';
import { type SelectOpenChangeReason, useSelectRoot } from './useSelectRoot';

/**
 * Groups all parts of the select.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value>(props: SelectRoot.Props<Value>): JSX.Element {
  const id = () => access(props.id);
  const valueProp = () => access(props.value);
  const defaultValue = () => access(props.defaultValue) ?? null;
  const open = () => access(props.open);
  const defaultOpen = () => access(props.defaultOpen) ?? false;
  const name = () => access(props.name);
  const disabled = () => access(props.disabled) ?? false;
  const readOnly = () => access(props.readOnly) ?? false;
  const required = () => access(props.required) ?? false;
  const modal = () => access(props.modal) ?? true;
  const actionsRef = () => access(props.actionsRef);
  const items = () => access(props.items);

  const { rootContext, floatingContext, value } = useSelectRoot<Value>({
    id,
    value: valueProp,
    defaultValue,
    // eslint-disable-next-line solid/reactivity
    onValueChange: props.onValueChange,
    open,
    defaultOpen,
    // eslint-disable-next-line solid/reactivity
    onOpenChange: props.onOpenChange,
    name,
    disabled,
    readOnly,
    required,
    modal,
    actionsRef,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
    items,
  });

  const { setDirty, validityData, validationMode, controlId } = useFieldRootContext();

  const serializedValue = createMemo(() => serializeValue(value()));

  return (
    <SelectRootContext.Provider value={rootContext}>
      <SelectFloatingContext.Provider value={floatingContext}>
        {props.children}
        <input
          ref={(el) => {
            if (props.refs) {
              props.refs.inputRef = el;
            }
            rootContext.fieldControlValidation.refs.inputRef = el;
          }}
          {...rootContext.fieldControlValidation.getInputValidationProps({
            onFocus() {
              // Move focus to the trigger element when the hidden input is focused.
              rootContext.store.triggerElement?.focus();
            },
            // Handle browser autofill.
            onInput(event: InputEvent) {
              // Workaround for https://github.com/facebook/react/issues/9023
              if (event.defaultPrevented) {
                return;
              }

              const nextValue = (event.target as HTMLSelectElement).value;

              rootContext.setStore('forceMount', true);
              const resolvedValue = value();

              queueMicrotask(() => {
                const exactValue = rootContext.refs.valuesRef.find(
                  (v) =>
                    v === nextValue ||
                    (typeof resolvedValue === 'string' &&
                      nextValue.toLowerCase() === v.toLowerCase()),
                );

                if (exactValue != null) {
                  setDirty(exactValue !== validityData.initialValue);
                  rootContext.setValue?.(exactValue, event);

                  if (validationMode() === 'onChange') {
                    rootContext.fieldControlValidation.commitValidation(exactValue);
                  }
                }
              });
            },
            id: id() || controlId() || undefined,
            name: rootContext.name(),
            disabled: rootContext.disabled(),
            required: rootContext.required(),
            readOnly: rootContext.readOnly(),
            value: serializedValue(),
            style: visuallyHidden,
            tabIndex: -1,
            'aria-hidden': true,
          })}
        />
      </SelectFloatingContext.Provider>
    </SelectRootContext.Provider>
  );
}

export namespace SelectRoot {
  export interface Props<Value> extends useSelectRoot.Parameters<Value> {
    children?: JSX.Element;
    refs?: {
      /**
       * A ref to access the hidden input element.
       */
      inputRef?: HTMLInputElement | null | undefined;
    };
  }

  export interface State {}

  export type Actions = useSelectRoot.Actions;

  export type OpenChangeReason = SelectOpenChangeReason;
}

export interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): JSX.Element;
}
