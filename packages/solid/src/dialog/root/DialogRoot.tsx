'use client';
import { type JSX } from 'solid-js';
import { access } from '../../solid-helpers';
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
  const defaultOpen = () => access(props.defaultOpen) ?? false;
  const dismissible = () => access(props.dismissible) ?? true;
  const modal = () => access(props.modal) ?? true;
  const open = () => access(props.open);
  const actionsRef = () => access(props.actionsRef);

  const parentDialogRootContext = useOptionalDialogRootContext();

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    // eslint-disable-next-line solid/reactivity
    onOpenChange: props.onOpenChange,
    modal,
    dismissible,
    actionsRef,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const nested = () => Boolean(parentDialogRootContext);

  const dialogContextValue: DialogContext = {
    ...dialogRoot,
    nested,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
  };

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
  export interface Props extends useDialogRoot.SharedParameters {
    children?: JSX.Element;
  }

  export type Actions = useDialogRoot.Actions;

  export type OpenChangeReason = DialogOpenChangeReason;
}
