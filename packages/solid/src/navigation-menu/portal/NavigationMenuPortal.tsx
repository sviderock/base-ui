'use client';
import { Show, type JSX } from 'solid-js';
import { FloatingPortal } from '../../floating-ui-solid';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { NavigationMenuPortalContext } from './NavigationMenuPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuPortal(props: NavigationMenuPortal.Props) {
  const keepMounted = () => props.keepMounted ?? false;

  const { mounted } = useNavigationMenuRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()}>
      <NavigationMenuPortalContext.Provider value={keepMounted}>
        <FloatingPortal root={props.container}>{props.children}</FloatingPortal>
      </NavigationMenuPortalContext.Provider>
    </Show>
  );
}

export namespace NavigationMenuPortal {
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
    container?: HTMLElement | null;
  }
}
