'use client';
import { createMemo } from 'solid-js';
import { FloatingFocusManager } from '../../floating-ui-solid';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { inertValue } from '../../utils/inertValue';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { type BaseUIComponentProps } from '../../utils/types';
import { InteractionType } from '../../utils/useEnhancedClickHandler';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { useDialogRootContext } from '../root/DialogRootContext';
import { DialogPopupCssVars } from './DialogPopupCssVars';
import { DialogPopupDataAttributes } from './DialogPopupDataAttributes';
import { useDialogPopup } from './useDialogPopup';

const customStyleHookMapping: CustomStyleHookMapping<DialogPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nestedDialogOpen(value) {
    return access(value) ? { [DialogPopupDataAttributes.nestedDialogOpen]: '' } : null;
  },
};

/**
 * A container for the dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogPopup(componentProps: DialogPopup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'finalFocus',
    'initialFocus',
  ]);

  const finalFocus = () => access(local.finalFocus);

  const {
    descriptionElementId,
    dismissible,
    floatingRootContext,
    getPopupProps,
    modal,
    mounted,
    nested,
    nestedOpenDialogCount,
    setOpen,
    open,
    openMethod,
    refs,
    setPopupElement,
    titleElementId,
    transitionStatus,
    onOpenChangeComplete,
  } = useDialogRootContext();

  useOpenChangeComplete({
    open,
    ref: () => refs.popupRef,
    onComplete() {
      if (open()) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const { popupProps, resolvedInitialFocus, dialogPopupRef } = useDialogPopup({
    descriptionElementId,
    initialFocus: local.initialFocus,
    modal,
    mounted,
    setOpen,
    openMethod,
    setPopupElement,
    titleElementId,
  });

  const nestedDialogOpen = () => nestedOpenDialogCount() > 0;

  const state = createMemo<DialogPopup.State>(() => ({
    open: open(),
    nested: nested(),
    transitionStatus: transitionStatus(),
    nestedDialogOpen: nestedDialogOpen(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      refs.popupRef = el;
      dialogPopupRef(el);
    },
    props: [
      () => getPopupProps(),
      popupProps,
      () => ({
        style: {
          [DialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount(),
        },
      }),
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <>
      {mounted() && modal() === true && (
        <InternalBackdrop
          managed
          inert={inertValue(!open())}
          ref={(el) => {
            refs.internalBackdropRef = el;
          }}
        />
      )}
      <FloatingFocusManager
        context={floatingRootContext}
        disabled={!mounted()}
        closeOnFocusOut={dismissible?.()}
        initialFocus={resolvedInitialFocus()}
        returnFocus={finalFocus()}
        modal={modal() !== false}
      >
        {element()}
      </FloatingFocusManager>
    </>
  );
}

export namespace DialogPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the dialog is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | MaybeAccessor<HTMLElement | null | undefined>
      | ((interactionType: InteractionType) => HTMLElement | null | undefined);
    /**
     * Determines the element to focus when the dialog is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: MaybeAccessor<HTMLElement | null | undefined>;
  }

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
    /**
     * Whether the dialog is nested within a parent dialog.
     */
    nested: boolean;
    /**
     * Whether the dialog has nested dialogs open.
     */
    nestedDialogOpen: boolean;
  }
}
