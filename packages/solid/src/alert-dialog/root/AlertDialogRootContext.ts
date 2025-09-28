'use client';
import { useContext } from 'solid-js';
import { DialogContext } from '../../dialog/utils/DialogContext';

export { DialogContext as AlertDialogRootContext };

export function useAlertDialogRootContext() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: AlertDialogRootContext is missing. AlertDialog parts must be placed within <AlertDialog.Root>.',
    );
  }

  return context;
}
