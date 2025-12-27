'use client';
import { Show, type JSX } from 'solid-js';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-solid';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { AlertDialogPortalContext } from './AlertDialogPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogPortal(props: AlertDialogPortal.Props) {
  const keepMounted = () => props.keepMounted ?? false;

  const { mounted } = useAlertDialogRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()}>
      <AlertDialogPortalContext.Provider value={keepMounted}>
        <FloatingPortal root={props.container}>{props.children}</FloatingPortal>
      </AlertDialogPortalContext.Provider>
    </Show>
  );
}

export namespace AlertDialogPortal {
  export interface Props {
    children?: JSX.Element;
    /**
     * Whether to keep the portal mounted in the DOM while the popup is hidden.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * A parent element to render the portal element into.
     */
    container?: FloatingPortalProps['root'];
  }
}
