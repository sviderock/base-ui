import { type JSX } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useFloatingTree } from '../../floating-ui-solid';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useMenuRootContext } from '../root/MenuRootContext';
import { REGULAR_ITEM, useMenuItem } from './useMenuItem';

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuItem(componentProps: MenuItem.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'closeOnClick',
    'disabled',
    'id',
    'label',
    'nativeButton',
  ]);
  const closeOnClick = () => local.closeOnClick ?? true;
  const disabled = () => local.disabled ?? false;
  const nativeButton = () => local.nativeButton ?? false;

  const listItem = useCompositeListItem({ label: () => local.label });

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const id = useBaseUiId(() => local.id);

  const highlighted = () => listItem.index() === activeIndex();
  const { events: menuEvents } = useFloatingTree()!;

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

  const state: MenuItem.State = {
    get disabled() {
      return disabled();
    },
    get highlighted() {
      return highlighted();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      setItemRef(el);
      listItem.setRef(el);
    },
    props: [itemProps, elementProps, getItemProps],
  });

  return <>{element()}</>;
}

export namespace MenuItem {
  export interface State {
    /**
     * Whether the item should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the item is highlighted.
     */
    highlighted: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
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
     *
     * @default true
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
