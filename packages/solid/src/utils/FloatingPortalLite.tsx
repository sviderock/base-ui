'use client';
import type { JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import { FloatingPortalProps, useFloatingPortalNode } from '../floating-ui-solid';

/**
 * `FloatingPortal` includes tabbable logic handling for focus management.
 * For components that don't need tabbable logic, use `FloatingPortalLite`.
 * @internal
 */
export function FloatingPortalLite(props: FloatingPortalLite.Props) {
  const { portalMount, portalRef } = useFloatingPortalNode({ root: () => props.root });

  return (
    <Portal mount={portalMount()} ref={portalRef}>
      {props.children}
    </Portal>
  );
}

export namespace FloatingPortalLite {
  export interface Props {
    children?: JSX.Element;
    root?: FloatingPortalProps['root'];
  }
}
