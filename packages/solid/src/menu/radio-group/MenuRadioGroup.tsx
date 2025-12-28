'use client';
import { batch, type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { MenuRadioGroupContext } from './MenuRadioGroupContext';

/**
 * Groups related radio items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuRadioGroup(componentProps: MenuRadioGroup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'value',
    'defaultValue',
    'onValueChange',
    'disabled',
  ]);
  const disabled = () => local.disabled ?? false;

  const [value, setValueUnwrapped] = useControlled({
    controlled: () => local.value,
    default: () => local.defaultValue,
    name: 'MenuRadioGroup',
  });

  const setValue = (newValue: any, event: Event) => {
    batch(() => {
      setValueUnwrapped(newValue);
      local.onValueChange?.(newValue, event);
    });
  };

  const state: MenuRadioGroup.State = {
    get disabled() {
      return disabled();
    },
  };

  const context: MenuRadioGroupContext = {
    value,
    setValue,
    disabled,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: [
      {
        role: 'group',
        get 'aria-disabled'() {
          return disabled() || undefined;
        },
      },
      elementProps,
    ],
  });

  return (
    <MenuRadioGroupContext.Provider value={context}>{element()}</MenuRadioGroupContext.Provider>
  );
}

export namespace MenuRadioGroup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content of the component.
     */
    children?: JSX.Element;
    /**
     * The controlled value of the radio item that should be currently selected.
     *
     * To render an uncontrolled radio group, use the `defaultValue` prop instead.
     */
    value?: any;
    /**
     * The uncontrolled value of the radio item that should be initially selected.
     *
     * To render a controlled radio group, use the `value` prop instead.
     */
    defaultValue?: any;
    /**
     * Function called when the selected value changes.
     *
     * @default () => {}
     */
    onValueChange?: (value: any, event: Event) => void;
    /**
     * Whether the component should ignore user interaction.
     *
     * @default false
     */
    disabled?: boolean;
  }

  export type State = {
    disabled: boolean;
  };
}
