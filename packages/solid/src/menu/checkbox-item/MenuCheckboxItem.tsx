'use client';
import { batch, type JSX } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useFloatingTree } from '../../floating-ui-solid';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useRenderElement } from '../../utils/useRenderElement';
import { REGULAR_ITEM, useMenuItem } from '../item/useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { itemMapping } from '../utils/styleHookMapping';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';

/**
 * A menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuCheckboxItem(componentProps: MenuCheckboxItem.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'id',
    'label',
    'closeOnClick',
    'nativeButton',
    'checked',
    'defaultChecked',
    'onCheckedChange',
    'disabled',
  ]);
  const closeOnClick = () => local.closeOnClick ?? false;
  const nativeButton = () => local.nativeButton ?? false;
  const disabled = () => local.disabled ?? false;

  const listItem = useCompositeListItem({ label: () => local.label });

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const id = useBaseUiId(() => local.id);

  const highlighted = () => listItem.index() === activeIndex();
  const { events: menuEvents } = useFloatingTree()!;

  const [checked, setChecked] = useControlled({
    controlled: () => local.checked,
    default: () => local.defaultChecked,
    name: 'MenuCheckboxItem',
    state: 'checked',
  });

  const { getItemProps, setItemRef } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    menuEvents,
    allowMouseUpTriggerRef,
    typingRef,
    nativeButton,
    itemMetadata: REGULAR_ITEM,
  });

  const state: MenuCheckboxItem.State = {
    get disabled() {
      return disabled();
    },
    get highlighted() {
      return highlighted();
    },
    get checked() {
      return checked();
    },
  };

  const context: MenuCheckboxItemContext = {
    checked,
    highlighted,
    disabled,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      setItemRef(el);
      listItem.setRef(el);
    },
    customStyleHookMapping: itemMapping,
    props: [
      itemProps,
      {
        role: 'menuitemcheckbox',
        get 'aria-checked'() {
          return checked();
        },
        onClick: (event) => {
          const nextChecked = !checked();
          batch(() => {
            setChecked(nextChecked);
            local.onCheckedChange?.(nextChecked, event);
          });
        },
      },
      elementProps,
      getItemProps,
    ],
  });

  return (
    <MenuCheckboxItemContext.Provider value={context}>{element()}</MenuCheckboxItemContext.Provider>
  );
}

export namespace MenuCheckboxItem {
  export type State = {
    /**
     * Whether the checkbox item should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the checkbox item is currently highlighted.
     */
    highlighted: boolean;
    /**
     * Whether the checkbox item is currently ticked.
     */
    checked: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the checkbox item is currently ticked.
     *
     * To render an uncontrolled checkbox item, use the `defaultChecked` prop instead.
     */
    checked?: boolean;
    /**
     * Whether the checkbox item is initially ticked.
     *
     * To render a controlled checkbox item, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: boolean;
    /**
     * Event handler called when the checkbox item is ticked or unticked.
     */
    onCheckedChange?: (checked: boolean, event: Event) => void;
    children?: JSX.Element;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Overrides the text label to use when the item is matched during keyboard text navigation.
     */
    label?: string;
    /**
     * Whether to close the menu when the item is clicked.
     * @default false
     */
    closeOnClick?: boolean;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: boolean;
  }
}
