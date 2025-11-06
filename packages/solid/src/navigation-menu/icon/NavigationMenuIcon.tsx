'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
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

  const state = createMemo<NavigationMenuIcon.State>(() => ({
    open: isActiveItem(),
  }));

  return (
    <RenderElement
      element="span"
      componentProps={componentProps}
      ref={componentProps.ref}
      params={{
        state: state(),
        customStyleHookMapping: triggerOpenStateMapping,
        props: [{ 'aria-hidden': true, children: '▼' }, elementProps],
      }}
    />
  );
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
