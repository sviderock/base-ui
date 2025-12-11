'use client';
import { createEffect, createMemo } from 'solid-js';
import { FloatingFocusManager } from '../../floating-ui-solid';
import { access, type MaybeAccessor, splitComponentProps } from '../../solid-helpers';
import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { InteractionType } from '../../utils/useEnhancedClickHandler';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import { usePopoverRootContext } from '../root/PopoverRootContext';

const customStyleHookMapping: CustomStyleHookMapping<PopoverPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the popover contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverPopup(componentProps: PopoverPopup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'initialFocus',
    'finalFocus',
  ]);
  const finalFocus = () => access(local.finalFocus);
  const initialFocus = () => access(local.initialFocus);

  const {
    open,
    instantType,
    transitionStatus,
    popupProps,
    titleId,
    descriptionId,
    refs,
    mounted,
    openReason,
    onOpenChangeComplete,
    modal,
    openMethod,
  } = usePopoverRootContext();
  const positioner = usePopoverPositionerContext();

  useOpenChangeComplete({
    open,
    ref: () => refs.popupRef,
    onComplete() {
      if (open()) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const resolvedInitialFocus = createMemo(() => {
    const resolved = initialFocus();
    if (resolved == null) {
      if (openMethod() === 'touch') {
        return refs.popupRef;
      }
      return 0;
    }

    if (typeof resolved === 'function') {
      return resolved(openMethod() ?? '');
    }

    return resolved;
  });

  const state = createMemo<PopoverPopup.State>(() => ({
    open: open(),
    side: positioner.side(),
    align: positioner.align(),
    instant: instantType(),
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
      () => ({
        'aria-labelledby': titleId(),
        'aria-describedby': descriptionId(),
      }),
      () => (transitionStatus() === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT),
      elementProps,
    ],
  });

  return (
    <FloatingFocusManager
      context={positioner.context}
      modal={modal() === 'trap-focus'}
      disabled={!mounted() || openReason() === 'trigger-hover'}
      initialFocus={resolvedInitialFocus()}
      returnFocus={finalFocus()}
    >
      {element()}
    </FloatingFocusManager>
  );
}

export namespace PopoverPopup {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the popover is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | MaybeAccessor<HTMLElement | null | undefined>
      | ((interactionType: InteractionType) => HTMLElement | null | undefined);
    /**
    /**
     * Determines the element to focus when the popover is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: MaybeAccessor<HTMLElement | null | undefined>;
  }
}
