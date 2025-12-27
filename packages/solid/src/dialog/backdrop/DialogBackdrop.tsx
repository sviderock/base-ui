'use client';
import { splitComponentProps } from '../../solid-helpers';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { type BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { useDialogRootContext } from '../root/DialogRootContext';

const customStyleHookMapping: CustomStyleHookMapping<DialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogBackdrop(componentProps: DialogBackdrop.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);
  const { open, nested, mounted, transitionStatus, refs } = useDialogRootContext();

  const state: DialogBackdrop.State = {
    get open() {
      return open();
    },
    get transitionStatus() {
      return transitionStatus();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      refs.backdropRef = el;
    },
    customStyleHookMapping,
    props: [
      {
        get hidden() {
          return !mounted();
        },
        role: 'presentation',
        style: {
          'user-select': 'none',
          '-webkit-user-select': 'none',
        },
      },
      elementProps,
    ],
    enabled: () => !nested(),
  });

  return <>{element()}</>;
}

export namespace DialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
