'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { NavigationMenuItemContext } from './NavigationMenuItemContext';

/**
 * An individual navigation menu item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuItem(componentProps: NavigationMenuItem.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['value']);

  const fallbackValue = useBaseUiId();
  const itemValue = () => local.value ?? fallbackValue();

  const { mounted: popupMounted, value } = useNavigationMenuRootContext();
  const itemOpen = () => popupMounted() && value() === itemValue();

  const { transitionStatus, setMounted, mounted } = useTransitionStatus(itemOpen, false, false);

  const isActiveItem = createMemo(() => itemOpen() && value() === itemValue());

  const context: NavigationMenuItemContext = {
    value: itemValue,
    open: itemOpen,
    mounted,
    setMounted,
    transitionStatus,
    isActive: isActiveItem,
  };

  const element = useRenderElement('div', componentProps, { props: elementProps });

  return (
    <NavigationMenuItemContext.Provider value={context}>
      <>{element()}</>
    </NavigationMenuItemContext.Provider>
  );
}

export namespace NavigationMenuItem {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * A unique value that identifies this navigation menu item.
     * If no value is provided, a unique ID will be generated automatically.
     * Use when controlling the navigation menu programmatically.
     */
    value?: any;
  }
}
