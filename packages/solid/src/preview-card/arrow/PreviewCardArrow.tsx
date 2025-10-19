'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { RenderElement } from '../../utils/useRenderElement';
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';

/**
 * Displays an element positioned against the preview card anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardArrow(componentProps: PreviewCardArrow.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open } = usePreviewCardRootContext();
  const { refs, side, align, arrowUncentered, arrowStyles } = usePreviewCardPositionerContext();

  const state = createMemo<PreviewCardArrow.State>(() => ({
    open: open(),
    side: side(),
    align: align(),
    uncentered: arrowUncentered(),
  }));

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={(el) => {
        refs.setArrowRef(el);
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{
        state: state(),
        props: [{ style: arrowStyles(), 'aria-hidden': true }, elementProps],
        customStyleHookMapping: popupStateMapping,
      }}
    />
  );
}

export namespace PreviewCardArrow {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
