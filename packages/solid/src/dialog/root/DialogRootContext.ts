'use client';
import {
  createContext,
  createEffect,
  onCleanup,
  onMount,
  useContext,
  type Accessor,
} from 'solid-js';
import { DialogContext } from '../utils/DialogContext';

export interface DialogRootContext {
  /**
   * Determines whether the dialog should close on outside clicks.
   */
  dismissible: Accessor<boolean>;
}

export const DialogRootContext = createContext<DialogRootContext>();

export function useOptionalDialogRootContext() {
  const dialogRootContext = useContext(DialogRootContext);
  const dialogContext = useContext(DialogContext);

  if (dialogContext === undefined && dialogRootContext === undefined) {
    return undefined;
  }

  return {
    ...dialogRootContext,
    ...dialogContext,
  };
}

export function useDialogRootContext() {
  const dialogRootContext = useContext(DialogRootContext);
  const dialogContext = useContext(DialogContext);

  if (dialogContext === undefined) {
    throw new Error(
      'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.',
    );
  }

  return {
    ...dialogRootContext,
    ...dialogContext,
  };
}
