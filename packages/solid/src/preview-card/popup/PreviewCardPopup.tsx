'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { usePreviewCardPositionerContext } from '../positioner/PreviewCardPositionerContext';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';

const customStyleHookMapping: CustomStyleHookMapping<PreviewCardPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the preview card contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardPopup(componentProps: PreviewCardPopup.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open, transitionStatus, refs, onOpenChangeComplete, popupProps } =
    usePreviewCardRootContext();
  const { side, align } = usePreviewCardPositionerContext();

  useOpenChangeComplete({
    open,
    ref: () => refs.popupRef,
    onComplete() {
      if (open()) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const state = createMemo<PreviewCardPopup.State>(() => ({
    open: open(),
    side: side(),
    align: align(),
    transitionStatus: transitionStatus(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      refs.popupRef = el;
    },
    customStyleHookMapping,
    props: [
      popupProps,
      () => (transitionStatus() === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT),
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace PreviewCardPopup {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
