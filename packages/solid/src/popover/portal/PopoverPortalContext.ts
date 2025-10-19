import { createContext, useContext, type Accessor } from 'solid-js';

export const PopoverPortalContext = createContext<Accessor<boolean>>();

export function usePopoverPortalContext() {
  const value = useContext(PopoverPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Popover.Portal> is missing.');
  }
  return value;
}
