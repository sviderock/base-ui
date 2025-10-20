'use client';
import { createMemo, Show, type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useSelectRootContext } from '../root/SelectRootContext';

const customStyleHookMapping: CustomStyleHookMapping<SelectValue.State> = {
  value: () => null,
};

/**
 * A text label of the currently selected item.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectValue(componentProps: SelectValue.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { store, refs } = useSelectRootContext();

  const labelFromItems = createMemo(() => {
    if (store.items) {
      if (Array.isArray(store.items)) {
        return store.items.find((item) => item.value === store.value)?.label;
      }
      return store.items[store.value];
    }
    return null;
  });

  const state = createMemo<SelectValue.State>(() => ({
    value: store.value,
  }));

  return (
    <RenderElement
      element="span"
      componentProps={{
        ...componentProps,
        children: (
          <Show
            when={typeof componentProps.children === 'function'}
            fallback={componentProps.children ?? labelFromItems() ?? store.value}
          >
            {(componentProps.children as Function)(store.value)}
          </Show>
        ),
      }}
      ref={(el) => {
        refs.valueRef = el;
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{
        state: state(),
        props: elementProps,
        customStyleHookMapping,
      }}
    />
  );
}

export namespace SelectValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    /**
     * Accepts a function that returns a `ReactNode` to format the selected value.
     * @example
     * ```tsx
     * <Select.Value>
     *   {(value: string | null) => value ? labels[value] : 'No value'}
     * </Select.Value>
     * ```
     */
    children?: JSX.Element | ((value: any) => JSX.Element);
  }

  export interface State {
    /**
     * The value of the currently selected item.
     */
    value: any;
  }
}
