'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { usePopoverRootContext } from '../root/PopoverRootContext';

const customStyleHookMapping: CustomStyleHookMapping<PopoverBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popover.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverBackdrop(props: PopoverBackdrop.Props) {
  const [, , elementProps] = splitComponentProps(props, []);

  const { open, mounted, transitionStatus, openReason } = usePopoverRootContext();

  const state = createMemo<PopoverBackdrop.State>(() => ({
    open: open(),
    transitionStatus: transitionStatus(),
  }));

  return (
    <RenderElement
      element="div"
      componentProps={props}
      ref={props.ref}
      params={{
        state: state(),
        customStyleHookMapping,
        props: [
          {
            role: 'presentation',
            hidden: !mounted(),
            style: {
              'pointer-events': openReason() === 'trigger-hover' ? 'none' : undefined,
              'user-select': 'none',
              '-webkit-user-select': 'none',
            },
          },
          elementProps,
        ],
      }}
    />
  );
}

export namespace PopoverBackdrop {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
