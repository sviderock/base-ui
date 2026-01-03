import { type JSX } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useFloatingTree } from '../../floating-ui-solid';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { REGULAR_ITEM, useMenuItem } from '../item/useMenuItem';
import { useMenuRadioGroupContext } from '../radio-group/MenuRadioGroupContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { itemMapping } from '../utils/styleHookMapping';
import { MenuRadioItemContext } from './MenuRadioItemContext';

/**
 * A menu item that works like a radio button in a given group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuRadioItem(componentProps: MenuRadioItem.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'id',
    'value',
    'label',
    'disabled',
    'closeOnClick',
    'nativeButton',
  ]);

  const disabledProp = () => local.disabled ?? false;
  const closeOnClick = () => local.closeOnClick ?? false;
  const nativeButton = () => local.nativeButton ?? false;

  const listItem = useCompositeListItem({ label: () => local.label });

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const id = useBaseUiId(() => local.id);

  const highlighted = () => listItem.index() === activeIndex();
  const { events: menuEvents } = useFloatingTree()!;

  const {
    value: selectedValue,
    setValue: setSelectedValue,
    disabled: groupDisabled,
  } = useMenuRadioGroupContext();

  const disabled = () => groupDisabled() || disabledProp();

  // This wrapper component is used as a performance optimization.
  // MenuRadioItem reads the context and re-renders the actual MenuRadioItem
  // only when it needs to.

  const checked = () => selectedValue() === local.value;

  const setChecked = (event: Event) => {
    setSelectedValue(local.value, event);
  };

  const contextValue = { checked, highlighted, disabled };

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

  const state: MenuRadioItem.State = {
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
        role: 'menuitemradio',
        get 'aria-checked'() {
          return checked();
        },
        onClick: (event) => {
          setChecked(event);
        },
      },
      elementProps,
      getItemProps,
    ],
  });

  return (
    <MenuRadioItemContext.Provider value={contextValue}>{element()}</MenuRadioItemContext.Provider>
  );
}

export namespace MenuRadioItem {
  export type State = {
    /**
     * Whether the radio item should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the radio item is currently highlighted.
     */
    highlighted: boolean;
    /**
     * Whether the radio item is currently selected.
     */
    checked: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Value of the radio item.
     * This is the value that will be set in the MenuRadioGroup when the item is selected.
     */
    value: any;
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
