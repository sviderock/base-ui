'use client';
import { useDialogPopup } from '../../dialog/popup/useDialogPopup';
import { FloatingFocusManager } from '../../floating-ui-solid';
import { access, splitComponentProps } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { inertValue } from '../../utils/inertValue';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { InteractionType } from '../../utils/useEnhancedClickHandler';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { AlertDialogPopupCssVars } from './AlertDialogPopupCssVars';
import { AlertDialogPopupDataAttributes } from './AlertDialogPopupDataAttributes';

const customStyleHookMapping: CustomStyleHookMapping<AlertDialogPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nestedDialogOpen(value) {
    return access(value) ? { [AlertDialogPopupDataAttributes.nestedDialogOpen]: '' } : null;
  },
};

/**
 * A container for the alert dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogPopup(componentProps: AlertDialogPopup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'initialFocus',
    'finalFocus',
  ]);

  const {
    descriptionElementId,
    floatingRootContext,
    getPopupProps,
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
    modal,
    onOpenChangeComplete,
  } = useAlertDialogRootContext();

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
    modal: true,
    mounted,
    setOpen,
    openMethod,
    setPopupElement,
    titleElementId,
  });

  const nestedDialogOpen = () => nestedOpenDialogCount() > 0;

  const state: AlertDialogPopup.State = {
    get open() {
      return open();
    },
    get nested() {
      return nested();
    },
    get transitionStatus() {
      return transitionStatus();
    },
    get nestedDialogOpen() {
      return nestedDialogOpen();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      refs.popupRef = el;
      dialogPopupRef(el);
    },
    props: [
      getPopupProps,
      popupProps,
      {
        get style() {
          return {
            [AlertDialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount(),
          };
        },
        role: 'alertdialog',
      },
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
        initialFocus={resolvedInitialFocus()}
        returnFocus={local.finalFocus}
      >
        {element()}
      </FloatingFocusManager>
    </>
  );
}

export namespace AlertDialogPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the dialog is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | HTMLElement
      | null
      | undefined
      | ((interactionType: InteractionType) => HTMLElement | null | undefined);
    /**
     * Determines the element to focus when the dialog is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: HTMLElement | null | undefined;
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
