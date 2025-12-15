'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';

/**
 * Displays an element positioned against the tooltip anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipArrow(componentProps: TooltipArrow.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open, setArrowRef, side, align, arrowUncentered, arrowStyles } =
    useTooltipPositionerContext();

  const state = createMemo<TooltipArrow.State>(() => ({
    open: open(),
    side: side(),
    align: align(),
    uncentered: arrowUncentered(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setArrowRef,
    props: [() => ({ style: arrowStyles(), 'aria-hidden': true }), elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return <>{element()}</>;
}

export namespace TooltipArrow {
  export interface State {
    /**
     * Whether the tooltip is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
