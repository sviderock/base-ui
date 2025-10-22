'use client';
import { Show, type JSX } from 'solid-js';
import type { FloatingPortalProps } from '../../floating-ui-solid';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { TooltipPortalContext } from './TooltipPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipPortal(props: TooltipPortal.Props) {
  const keepMounted = () => access(props.keepMounted) ?? false;
  const container = () => access(props.container);

  const { mounted } = useTooltipRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()}>
      <TooltipPortalContext.Provider value={keepMounted}>
        <FloatingPortalLite root={container()}>{props.children}</FloatingPortalLite>
      </TooltipPortalContext.Provider>
    </Show>
  );
}

export namespace TooltipPortal {
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
