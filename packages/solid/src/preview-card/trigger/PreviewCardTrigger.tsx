'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';

/**
 * A link that opens the preview card.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardTrigger(componentProps: PreviewCardTrigger.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open, triggerProps, setTriggerElement } = usePreviewCardRootContext();

  const state = createMemo<PreviewCardTrigger.State>(() => ({ open: open() }));

  const element = useRenderElement('a', componentProps, {
    state,
    ref: setTriggerElement,
    props: [triggerProps, elementProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return <>{element()}</>;
}

export namespace PreviewCardTrigger {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'a', State> {}
}
