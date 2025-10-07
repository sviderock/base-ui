import { createContext, useContext, type Accessor } from 'solid-js';

export const MenuPortalContext = createContext<Accessor<boolean | undefined>>();

export function useMenuPortalContext() {
  const value = useContext(MenuPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Menu.Portal> is missing.');
  }
  return value;
}
