'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useMenuRootContext } from '../root/MenuRootContext';

/**
 * Displays an element positioned against the menu anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuArrow(componentProps: MenuArrow.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open } = useMenuRootContext();
  const { refs, side, align, arrowUncentered, arrowStyles } = useMenuPositionerContext();

  const state = createMemo<MenuArrow.State>(() => ({
    open: open(),
    side: side(),
    align: align(),
    uncentered: arrowUncentered(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: refs.setArrowRef,
    customStyleHookMapping: popupStateMapping,
    props: [() => ({ style: arrowStyles(), 'aria-hidden': true }), elementProps],
  });

  return <>{element()}</>;
}

export namespace MenuArrow {
  export interface State {
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
