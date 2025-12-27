'use client';
import { Show, type JSX } from 'solid-js';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-solid';
import { access } from '../../solid-helpers';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPortalContext } from './PopoverPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverPortal(props: PopoverPortal.Props) {
  const keepMounted = () => access(props.keepMounted) ?? false;

  const { mounted } = usePopoverRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()}>
      <PopoverPortalContext.Provider value={keepMounted}>
        <FloatingPortal root={props.container}>{props.children}</FloatingPortal>
      </PopoverPortalContext.Provider>
    </Show>
  );
}

export namespace PopoverPortal {
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
