'use client';
import { useContext } from 'solid-js';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { type DialogOpenChangeReason, useDialogRoot } from '../../dialog/root/useDialogRoot';
import { access } from '../../solid-helpers';
import { AlertDialogRootContext } from './AlertDialogRootContext';

/**
 * Groups all parts of the alert dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogRoot(props: AlertDialogRoot.Props) {
  const defaultOpen = () => access(props.defaultOpen) ?? false;
  const open = () => access(props.open);
  const actionsRef = () => access(props.actionsRef);

  const parentDialogRootContext = useContext(AlertDialogRootContext);

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    onOpenChange: (...args) => props.onOpenChange?.(...args),
    actionsRef: actionsRef(),
    onOpenChangeComplete: (...args) => props.onOpenChangeComplete?.(...args),
    modal: true,
    dismissible: false,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const nested = () => Boolean(parentDialogRootContext);

  const contextValue: AlertDialogRootContext = {
    ...dialogRoot,
    nested,
    onOpenChangeComplete: (...args) => props.onOpenChangeComplete?.(...args),
  };

  return (
    <AlertDialogRootContext.Provider value={contextValue}>
      {props.children}
    </AlertDialogRootContext.Provider>
  );
}

export namespace AlertDialogRoot {
  export interface Props extends Omit<DialogRoot.Props, 'modal' | 'dismissible' | 'onOpenChange'> {
    /**
     * Event handler called when the dialog is opened or closed.
     * @type (open: boolean, event?: Event, reason?: AlertDialog.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: DialogOpenChangeReason | undefined,
    ) => void;
  }

  export type Actions = DialogRoot.Actions;

  export type OpenChangeReason = DialogOpenChangeReason;
}
