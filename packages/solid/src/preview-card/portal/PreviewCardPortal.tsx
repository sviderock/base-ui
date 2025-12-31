import { type JSX, Show } from 'solid-js';
import type { FloatingPortalProps } from '../../floating-ui-solid';
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
  const keepMounted = () => props.keepMounted ?? false;

  const { mounted } = usePreviewCardRootContext();

  const shouldRender = () => mounted() || keepMounted();

  return (
    <Show when={shouldRender()}>
      <PreviewCardPortalContext.Provider value={keepMounted}>
        <FloatingPortalLite root={props.container}>{props.children}</FloatingPortalLite>
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
    keepMounted?: boolean;
    /**
     * A parent element to render the portal element into.
     */
    container?: FloatingPortalProps['root'];
  }
}
