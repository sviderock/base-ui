'use client';
import { createMemo, type JSX } from 'solid-js';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
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
  const defaultValue = () => props.defaultValue ?? null;
  const defaultOpen = () => props.defaultOpen ?? false;
  const disabled = () => props.disabled ?? false;
  const readOnly = () => props.readOnly ?? false;
  const required = () => props.required ?? false;
  const modal = () => props.modal ?? true;

  const { rootContext, floatingContext, value } = useSelectRoot<Value>({
    id: () => props.id,
    value: () => props.value,
    defaultValue,
    // eslint-disable-next-line solid/reactivity
    onValueChange: props.onValueChange,
    open: () => props.open,
    defaultOpen,
    // eslint-disable-next-line solid/reactivity
    onOpenChange: props.onOpenChange,
    name: () => props.name,
    disabled,
    readOnly,
    required,
    modal,
    actionsRef: () => props.actionsRef,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
    items: () => props.items,
  });

  const { setDirty, validityData, validationMode, controlId } = useFieldRootContext();

  const serializedValue = createMemo(() => serializeValue(value()));

  return (
    <SelectRootContext.Provider value={rootContext}>
      <SelectFloatingContext.Provider value={floatingContext}>
        {props.children}
        <input
          {...(rootContext.fieldControlValidation.getInputValidationProps({
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
            ref: (el: HTMLInputElement) => {
              if (props.refs) {
                props.refs.inputRef = el;
              }
              rootContext.fieldControlValidation.refs.inputRef = el;
            },
            id: props.id || controlId() || undefined,
            name: rootContext.name(),
            disabled: rootContext.disabled(),
            required: rootContext.required(),
            readOnly: rootContext.readOnly(),
            value: serializedValue(),
            style: visuallyHidden,
            tabIndex: -1,
            'aria-hidden': true,
          }) as unknown as JSX.HTMLAttributes<HTMLInputElement>)}
        />
      </SelectFloatingContext.Provider>
    </SelectRootContext.Provider>
  );
}

export namespace SelectRoot {
  export interface Props<Value> {
    children?: JSX.Element;
    refs?: {
      /**
       * A ref to access the hidden input element.
       */
      inputRef?: HTMLInputElement | null | undefined;
    };

    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The id of the Select.
     */
    id?: string;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the user should be unable to choose a different option from the select menu.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * The value of the select.
     */
    value?: Value | null;
    /**
     * Callback fired when the value of the select changes. Use when controlled.
     */
    onValueChange?: (value: Value, event?: Event) => void;
    /**
     * The uncontrolled value of the select when it’s initially rendered.
     *
     * To render a controlled select, use the `value` prop instead.
     * @default null
     */
    defaultValue?: Value | null;
    /**
     * Whether the select menu is initially open.
     *
     * To render a controlled select menu, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the select menu is opened or closed.
     * @type (open: boolean, event?: Event, reason?: Select.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: SelectOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the select menu is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the select menu is currently open.
     */
    open?: boolean;
    /**
     * Determines if the select enters a modal state when open.
     * - `true`: user interaction is limited to the select: document page scroll is locked and and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * @default true
     */
    modal?: boolean;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the select will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the select manually.
     * Useful when the select's animation is controlled by an external library.
     */
    actionsRef?: Actions;
    /**
     * Data structure of the items rendered in the select menu.
     * When specified, `<Select.Value>` renders the label of the selected item instead of the raw value.
     * @example
     * ```tsx
     * const items = {
     *   sans: 'Sans-serif',
     *   serif: 'Serif',
     *   mono: 'Monospace',
     *   cursive: 'Cursive',
     * };
     * <Select.Root items={items} />
     * ```
     */
    items?: Record<string, JSX.Element> | Array<{ label: JSX.Element; value: Value }>;
  }

  export interface State {}

  export type Actions = useSelectRoot.Actions;

  export type OpenChangeReason = SelectOpenChangeReason;
}

export interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): JSX.Element;
}
