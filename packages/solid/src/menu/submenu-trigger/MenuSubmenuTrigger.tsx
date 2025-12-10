'use client';
import type { MenuParent } from '@base-ui-components/solid/menu/root/MenuRoot';
import { batch, createEffect, createMemo, type JSX } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useFloatingTree } from '../../floating-ui-solid';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useMenuItem } from '../item/useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';

/**
 * A menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuSubmenuTrigger(componentProps: MenuSubmenuTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'label',
    'id',
    'nativeButton',
  ]);
  const idProp = () => access(local.id);
  const nativeButton = () => access(local.nativeButton) ?? false;

  const id = useBaseUiId(() => idProp());

  const {
    triggerProps: rootTriggerProps,
    parent,
    setTriggerElement,
    open,
    typingRef,
    disabled,
    allowMouseUpTriggerRef,
  } = useMenuRootContext();

  createEffect(() => {
    if (parent().type !== 'menu') {
      throw new Error('Base UI: <Menu.SubmenuTrigger> must be placed in <Menu.SubmenuRoot>.');
    }
  });

  const parentMenuContext = () => (parent() as Extract<MenuParent, { type: 'menu' }>).context;

  const item = useCompositeListItem();

  const highlighted = () => parentMenuContext().activeIndex() === item.index();

  const { events: menuEvents } = useFloatingTree()!;

  const { getItemProps, setItemRef } = useMenuItem({
    closeOnClick: false,
    disabled,
    highlighted,
    id,
    menuEvents,
    allowMouseUpTriggerRef,
    typingRef,
    nativeButton,
    itemMetadata: () => ({
      type: 'submenu-trigger',
      setActive: () => parentMenuContext().setActiveIndex(item.index()),
      allowMouseEnterEnabled: parentMenuContext().allowMouseEnter(),
    }),
  });

  const state = createMemo<MenuSubmenuTrigger.State>(() => ({
    disabled: disabled(),
    highlighted: highlighted(),
    open: open(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      batch(() => {
        item.setRef(el);
        setItemRef(el);
        setTriggerElement(el);
      });
    },
    customStyleHookMapping: triggerOpenStateMapping,
    props: [
      rootTriggerProps,
      () => parentMenuContext().itemProps(),
      elementProps,
      getItemProps,
      () => ({
        tabIndex: open() || highlighted() ? 0 : -1,
        onBlur() {
          if (highlighted()) {
            parentMenuContext().setActiveIndex(null);
          }
        },
      }),
    ],
  });

  return <>{element()}</>;
}

export namespace MenuSubmenuTrigger {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: JSX.Element;
    /**
     * Overrides the text label to use when the item is matched during keyboard text navigation.
     */
    label?: MaybeAccessor<string | undefined>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }

  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    highlighted: boolean;
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
  }
}
