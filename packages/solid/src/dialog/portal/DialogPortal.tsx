'use client';
import { Show, type JSX } from 'solid-js';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-solid';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPortalContext } from './DialogPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogPortal(props: DialogPortal.Props) {
  const keepMounted = () => access(props.keepMounted) ?? false;
  const container = () => access(props.container);

  const { mounted } = useDialogRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()}>
      <DialogPortalContext.Provider value={keepMounted}>
        <FloatingPortal root={container()}>{props.children}</FloatingPortal>
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
    keepMounted?: MaybeAccessor<boolean | undefined>;
    /**
     * A parent element to render the portal element into.
     */
    container?: MaybeAccessor<FloatingPortalProps['root'] | undefined>;
  }
}
