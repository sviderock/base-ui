'use client';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { useDialogRoot } from '../root/useDialogRoot';

/**
 * Common context for dialog & dialog alert components.
 */
export interface DialogContext extends useDialogRoot.ReturnValue {
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  nested: Accessor<boolean>;
  /**
   * Callback to invoke after any animations complete when the dialog is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
}

export const DialogContext = createContext<DialogContext | undefined>(undefined);

export function useDialogContext() {
  return useContext(DialogContext);
}
