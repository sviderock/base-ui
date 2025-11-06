'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { RenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuPositionerContext } from '../positioner/NavigationMenuPositionerContext';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

/**
 * Displays an element pointing toward the navigation menu's current anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuArrow(componentProps: NavigationMenuArrow.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open } = useNavigationMenuRootContext();
  const { refs, side, align, arrowUncentered, arrowStyles } = useNavigationMenuPositionerContext();

  const state = createMemo<NavigationMenuArrow.State>(() => ({
    open: open(),
    side: side(),
    align: align(),
    uncentered: arrowUncentered(),
  }));

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={(el) => {
        refs.setArrowRef(el);
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{
        state: state(),
        customStyleHookMapping: popupStateMapping,
        props: [{ style: arrowStyles(), 'aria-hidden': true }, elementProps],
      }}
    />
  );
}

export namespace NavigationMenuArrow {
  export interface State {
    /**
     * Whether the popup is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
