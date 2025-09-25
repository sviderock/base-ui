'use client';
import { createMemo, type Accessor } from 'solid-js';
import { COMPOSITE_KEYS } from '../../composite/composite';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { HTMLProps } from '../../utils/types';
import { type InteractionType } from '../../utils/useEnhancedClickHandler';
import type { DialogOpenChangeReason } from '../root/useDialogRoot';

export function useDialogPopup(parameters: useDialogPopup.Parameters): useDialogPopup.ReturnValue {
  const descriptionElementId = () => access(parameters.descriptionElementId);
  const modal = () => access(parameters.modal);
  const mounted = () => access(parameters.mounted);
  const openMethod = () => access(parameters.openMethod);
  const titleElementId = () => access(parameters.titleElementId);
  const initialFocus = () => access(parameters.initialFocus);

  let popupRef: HTMLElement | null | undefined;

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const defaultInitialFocus = (interactionType: InteractionType) => {
    if (interactionType === 'touch') {
      return popupRef;
    }

    return 0;
  };

  const resolvedInitialFocus = createMemo(() => {
    const initialFocusValue = initialFocus();
    if (initialFocusValue == null) {
      return defaultInitialFocus(openMethod() ?? '');
    }

    if (typeof initialFocusValue === 'function') {
      return initialFocusValue(openMethod() ?? '');
    }

    return initialFocusValue;
  });

  const popupProps = createMemo<HTMLProps>(() => {
    return {
      'aria-labelledby': titleElementId() ?? undefined,
      'aria-describedby': descriptionElementId() ?? undefined,
      'aria-modal': mounted() && modal() === true ? true : undefined,
      role: 'dialog',
      tabIndex: -1,
      hidden: !mounted(),
      onKeyDown(event) {
        if (COMPOSITE_KEYS.has(event.key)) {
          event.stopPropagation();
        }
      },
    };
  });

  return {
    popupProps,
    resolvedInitialFocus,
    dialogPopupRef: (el) => {
      popupRef = el;
      parameters.setPopupElement(el);
    },
  };
}

export namespace useDialogPopup {
  export interface Parameters {
    modal: MaybeAccessor<boolean | 'trap-focus' | undefined>;
    openMethod: MaybeAccessor<InteractionType | null>;
    /**
     * Event handler called when the dialog is opened or closed.
     */
    setOpen: (
      open: boolean,
      event: Event | undefined,
      reason: DialogOpenChangeReason | undefined,
    ) => void;
    /**
     * The id of the title element associated with the dialog.
     */
    titleElementId: MaybeAccessor<string | undefined>;
    /**
     * The id of the description element associated with the dialog.
     */
    descriptionElementId: MaybeAccessor<string | undefined>;
    /**
     * Determines the element to focus when the dialog is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | MaybeAccessor<HTMLElement | null | undefined>
      | ((interactionType: InteractionType) => HTMLElement | null | undefined);

    /**
     * Determines if the dialog should be mounted.
     */
    mounted: MaybeAccessor<boolean>;
    /**
     * Callback to register the popup element.
     */
    setPopupElement: (element: HTMLElement | null | undefined) => void;
  }

  export interface ReturnValue {
    popupProps: Accessor<HTMLProps>;
    resolvedInitialFocus: Accessor<HTMLElement | null | undefined | number>;
    dialogPopupRef: (el: HTMLElement | undefined | null) => void;
  }
}
