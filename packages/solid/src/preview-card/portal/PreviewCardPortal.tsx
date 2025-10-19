'use client';
import { type JSX, Show } from 'solid-js';
import type { FloatingPortalProps } from '../../floating-ui-solid';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { PreviewCardPortalContext } from './PreviewCardPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardPortal(props: PreviewCardPortal.Props) {
  const keepMounted = () => access(props.keepMounted) ?? false;
  const container = () => access(props.container);

  const { mounted } = usePreviewCardRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()}>
      <PreviewCardPortalContext.Provider value={keepMounted}>
        <FloatingPortalLite root={container()}>{props.children}</FloatingPortalLite>
      </PreviewCardPortalContext.Provider>
    </Show>
  );
}

export namespace PreviewCardPortal {
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
