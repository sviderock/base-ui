'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
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

  return (
    <RenderElement
      element="a"
      componentProps={componentProps}
      ref={(el) => {
        setTriggerElement(el);
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{
        state: state(),
        props: [triggerProps(), elementProps],
        customStyleHookMapping: triggerOpenStateMapping,
      }}
    />
  );
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
