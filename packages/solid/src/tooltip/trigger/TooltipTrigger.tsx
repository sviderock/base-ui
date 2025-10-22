'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useTooltipRootContext } from '../root/TooltipRootContext';

/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipTrigger(componentProps: TooltipTrigger.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open, setTriggerElement, triggerProps } = useTooltipRootContext();
  const state = createMemo<TooltipTrigger.State>(() => ({ open: open() }));

  return (
    <RenderElement
      element="button"
      componentProps={componentProps}
      ref={(el) => {
        setTriggerElement(el);
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{
        state: state(),
        props: [triggerProps(), elementProps],
        customStyleHookMapping: triggerOpenStateMapping,
      }}
    />
  );
}

export namespace TooltipTrigger {
  export interface State {
    /**
     * Whether the tooltip is currently open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
