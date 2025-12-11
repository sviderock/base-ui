'use client';
import { createMemo } from 'solid-js';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * Contains a list of navigation menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuList(componentProps: NavigationMenuList.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { orientation, open } = useNavigationMenuRootContext();

  const state = createMemo<NavigationMenuList.State>(() => ({
    open: open(),
  }));

  const element = useRenderElement('div', componentProps, { state, props: elementProps });

  return (
    <CompositeRoot loop={false} orientation={orientation()} stopEventPropagation render={element} />
  );
}

export namespace NavigationMenuList {
  export interface State {
    /**
     * If `true`, the popup is open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
