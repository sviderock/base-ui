'use client';
import { Show, type JSX } from 'solid-js';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-solid';
import { access, MaybeAccessor } from '../../solid-helpers';
import { useMenuRootContext } from '../root/MenuRootContext';
import { MenuPortalContext } from './MenuPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuPortal(props: MenuPortal.Props) {
  const keepMounted = () => access(props.keepMounted) ?? false;

  const { mounted } = useMenuRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()} fallback={null}>
      <MenuPortalContext.Provider value={keepMounted}>
        <FloatingPortal root={props.container}>{props.children}</FloatingPortal>
      </MenuPortalContext.Provider>
    </Show>
  );
}

export namespace MenuPortal {
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
    container?: FloatingPortalProps['root'];
  }
}
