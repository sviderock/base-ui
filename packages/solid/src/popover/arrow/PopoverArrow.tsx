'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { RenderElement } from '../../utils/useRenderElement';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import { usePopoverRootContext } from '../root/PopoverRootContext';

/**
 * Displays an element positioned against the popover anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverArrow(componentProps: PopoverArrow.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open } = usePopoverRootContext();
  const { refs, side, align, arrowUncentered, arrowStyles } = usePopoverPositionerContext();

  const state = createMemo<PopoverArrow.State>(() => ({
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
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
        refs.setArrowRef(el);
      }}
      params={{
        state: state(),
        customStyleHookMapping: popupStateMapping,
        props: [{ style: arrowStyles(), 'aria-hidden': true }, elementProps],
      }}
    />
  );
}

export namespace PopoverArrow {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
