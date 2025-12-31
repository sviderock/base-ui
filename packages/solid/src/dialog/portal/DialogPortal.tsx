import { Show, type JSX } from 'solid-js';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-solid';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogPortal(props: DialogPortal.Props) {
  const keepMounted = () => props.keepMounted ?? false;

  const { mounted } = useDialogRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()}>
      <DialogPortalContext.Provider value={keepMounted}>
        <FloatingPortal root={props.container}>{props.children}</FloatingPortal>
      </DialogPortalContext.Provider>
    </Show>
  );
}

export namespace DialogPortal {
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
