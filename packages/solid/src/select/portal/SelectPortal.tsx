'use client';
import { Show, type JSX } from 'solid-js';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-solid';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { useSelectRootContext } from '../root/SelectRootContext';
import { SelectPortalContext } from './SelectPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectPortal(props: SelectPortal.Props) {
  const { store } = useSelectRootContext();
  const container = () => access(props.container);

  const shouldRender = () => store.mounted || store.forceMount;

  return (
    <Show when={shouldRender()}>
      <SelectPortalContext.Provider value>
        <FloatingPortal root={container()}>{props.children}</FloatingPortal>
      </SelectPortalContext.Provider>
    </Show>
  );
}

export namespace SelectPortal {
  export interface Props {
    children?: JSX.Element;
    /**
     * A parent element to render the portal element into.
     */
    container?: MaybeAccessor<FloatingPortalProps['root'] | undefined>;
  }
}
