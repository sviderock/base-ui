import { type JSX } from 'solid-js';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';

/**
 * A portal element that moves the viewport to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastPortal(props: ToastPortal.Props) {
  return <FloatingPortalLite root={props.container}>{props.children}</FloatingPortalLite>;
}

export namespace ToastPortal {
  export interface Props {
    children?: JSX.Element;
    /**
     * A parent element to render the portal element into.
     */
    container?: HTMLElement | null | undefined;
  }
}
