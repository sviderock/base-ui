'use client';
import { splitComponentProps } from '../../solid-helpers';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
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

  const state: TooltipTrigger.State = {
    get open() {
      return open();
    },
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: setTriggerElement,
    props: [triggerProps, elementProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return <>{element()}</>;
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
