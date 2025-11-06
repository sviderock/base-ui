'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

const customStyleHookMapping: CustomStyleHookMapping<AlertDialogBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogBackdrop(componentProps: AlertDialogBackdrop.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);
  const { open, nested, mounted, transitionStatus, refs } = useAlertDialogRootContext();

  const state = createMemo<AlertDialogBackdrop.State>(() => ({
    open: open(),
    transitionStatus: transitionStatus(),
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
        refs.backdropRef = el;
      }}
      params={{
        state: state(),
        customStyleHookMapping,
        props: [
          {
            role: 'presentation',
            hidden: !mounted(),
            style: {
              'user-select': 'none',
              '-webkit-user-select': 'none',
            },
          },
          elementProps,
        ],
        // no need to render nested backdrops
        enabled: !nested(),
      }}
    />
  );
}

export namespace AlertDialogBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
