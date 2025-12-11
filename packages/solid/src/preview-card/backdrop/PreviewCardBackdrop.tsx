'use client';
import { createMemo } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';

const customStyleHookMapping: CustomStyleHookMapping<PreviewCardBackdrop.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardBackdrop(componentProps: PreviewCardBackdrop.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { open, mounted, transitionStatus } = usePreviewCardRootContext();

  const state = createMemo<PreviewCardBackdrop.State>(() => ({
    open: open(),
    transitionStatus: transitionStatus(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    customStyleHookMapping,
    props: [
      () => ({
        role: 'presentation',
        hidden: !mounted(),
        style: {
          'pointer-events': 'none',
          'user-select': 'none',
          '-webkit-user-select': 'none',
        },
      }),
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace PreviewCardBackdrop {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
