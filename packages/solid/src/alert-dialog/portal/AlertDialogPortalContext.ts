import { createContext, useContext, type Accessor } from 'solid-js';

export const AlertDialogPortalContext = createContext<Accessor<boolean | undefined>>(
  () => undefined,
);

export function useAlertDialogPortalContext() {
  const value = useContext(AlertDialogPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <AlertDialog.Portal> is missing.');
  }
  return value;
}
