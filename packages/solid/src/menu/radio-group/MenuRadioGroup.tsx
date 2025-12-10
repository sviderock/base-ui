'use client';
import { batch, createMemo, type JSX } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
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
  const valueProp = () => access(local.value);
  const defaultValue = () => access(local.defaultValue);
  const disabled = () => access(local.disabled) ?? false;

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'MenuRadioGroup',
  });

  const setValue = (newValue: any, event: Event) => {
    batch(() => {
      setValueUnwrapped(newValue);
      local.onValueChange?.(newValue, event);
    });
  };

  const state = createMemo<MenuRadioGroup.State>(() => ({
    disabled: disabled(),
  }));

  const context: MenuRadioGroupContext = {
    value,
    setValue,
    disabled,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: [
      () => ({
        role: 'group',
        'aria-disabled': disabled() || undefined,
      }),
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
    value?: MaybeAccessor<any>;
    /**
     * The uncontrolled value of the radio item that should be initially selected.
     *
     * To render a controlled radio group, use the `value` prop instead.
     */
    defaultValue?: MaybeAccessor<any>;
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
    disabled?: MaybeAccessor<boolean | undefined>;
  }

  export type State = {
    disabled: boolean;
  };
}
