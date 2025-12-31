import { type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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

  const state: PopoverBackdrop.State = {
    get open() {
      return open();
    },
    get transitionStatus() {
      return transitionStatus();
    },
  };

  const element = useRenderElement('div', props, {
    state,
    customStyleHookMapping,
    props: [
      {
        role: 'presentation',
        get hidden() {
          return !mounted();
        },
        get style(): JSX.CSSProperties {
          return {
            'pointer-events': openReason() === 'trigger-hover' ? 'none' : undefined,
            'user-select': 'none',
            '-webkit-user-select': 'none',
          };
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
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
