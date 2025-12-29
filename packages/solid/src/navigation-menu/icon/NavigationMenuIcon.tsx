'use client';
import { splitComponentProps } from '../../solid-helpers';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * An icon that indicates that the trigger button opens a menu.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuIcon(componentProps: NavigationMenuIcon.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { value: itemValue } = useNavigationMenuItemContext();
  const { open, value } = useNavigationMenuRootContext();

  const isActiveItem = () => open() && value() === itemValue();

  const state: NavigationMenuIcon.State = {
    get open() {
      return isActiveItem();
    },
  };

  const element = useRenderElement('span', componentProps, {
    state,
    customStyleHookMapping: triggerOpenStateMapping,
    props: [{ 'aria-hidden': true, children: '▼' }, elementProps],
  });

  return <>{element()}</>;
}

export namespace NavigationMenuIcon {
  export interface State {
    /**
     * Whether the navigation menu is open and the item is active.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'span', State> {}
}
