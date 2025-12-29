'use client';
import { splitComponentProps } from '../../solid-helpers';
import { DISABLED_TRANSITIONS_STYLE } from '../../utils/constants';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import { useTooltipRootContext } from '../root/TooltipRootContext';

const customStyleHookMapping: CustomStyleHookMapping<TooltipPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the tooltip contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipPopup(componentProps: TooltipPopup.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open, instantType, transitionStatus, popupProps, refs, onOpenChangeComplete } =
    useTooltipRootContext();
  const { side, align } = useTooltipPositionerContext();

  useOpenChangeComplete({
    open,
    ref: () => refs.popupRef,
    onComplete() {
      if (open()) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const state: TooltipPopup.State = {
    get open() {
      return open();
    },
    get side() {
      return side();
    },
    get align() {
      return align();
    },
    get instant() {
      return instantType();
    },
    get transitionStatus() {
      return transitionStatus();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      refs.popupRef = el;
    },
    props: [
      popupProps,
      {
        get style() {
          return transitionStatus() === 'starting' ? DISABLED_TRANSITIONS_STYLE.style : undefined;
        },
      },
      elementProps,
    ],
    customStyleHookMapping,
  });

  return <>{element()}</>;
}

export namespace TooltipPopup {
  export interface State {
    /**
     * Whether the tooltip is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    instant: 'delay' | 'focus' | 'dismiss' | undefined;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
