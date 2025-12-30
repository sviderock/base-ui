'use client';
import { mergeProps as solidMergeProps, type JSX } from 'solid-js';
import { DialogContext } from '../utils/DialogContext';
import { DialogRootContext, useOptionalDialogRootContext } from './DialogRootContext';
import { useDialogRoot, type DialogOpenChangeReason } from './useDialogRoot';

/**
 * Groups all parts of the dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogRoot(props: DialogRoot.Props) {
  const defaultOpen = () => props.defaultOpen ?? false;
  const dismissible = () => props.dismissible ?? true;
  const modal = () => props.modal ?? true;

  const parentDialogRootContext = useOptionalDialogRootContext();

  const dialogRoot = useDialogRoot({
    open: () => props.open,
    defaultOpen,
    // eslint-disable-next-line solid/reactivity
    onOpenChange: props.onOpenChange,
    modal,
    dismissible,
    actionsRef: () => props.actionsRef,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const nested = () => Boolean(parentDialogRootContext);

  const dialogContextValue: DialogContext = solidMergeProps(dialogRoot, {
    nested,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
  });

  const dialogRootContextValue: DialogRootContext = {
    dismissible,
  };

  return (
    <DialogContext.Provider value={dialogContextValue}>
      <DialogRootContext.Provider value={dialogRootContextValue}>
        {props.children}
      </DialogRootContext.Provider>
    </DialogContext.Provider>
  );
}

export namespace DialogRoot {
  export interface Props {
    children?: JSX.Element;
    /**
     * Whether the dialog is currently open.
     */
    open?: boolean;
    /**
     * Whether the dialog is initially open.
     *
     * To render a controlled dialog, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Determines if the dialog enters a modal state when open.
     * - `true`: user interaction is limited to just the dialog: focus is trapped, document page scroll is locked, and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * - `'trap-focus'`: focus is trapped inside the dialog, but document page scroll is not locked and pointer interactions outside of it remain enabled.
     * @default true
     */
    modal?: boolean | 'trap-focus';
    /**
     * Event handler called when the dialog is opened or closed.
     * @type (open: boolean, event?: Event, reason?: Dialog.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: DialogOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the dialog is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Determines whether the dialog should close on outside clicks.
     * @default true
     */
    dismissible?: boolean;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the dialog will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the dialog manually.
     * Useful when the dialog's animation is controlled by an external library.
     */
    actionsRef?: { unmount: () => void };
  }

  export type Actions = useDialogRoot.Actions;

  export type OpenChangeReason = DialogOpenChangeReason;
}
