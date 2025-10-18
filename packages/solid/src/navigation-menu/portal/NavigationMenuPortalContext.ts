import { createContext, useContext, type Accessor } from 'solid-js';

export const NavigationMenuPortalContext = createContext<Accessor<boolean>>();

export function useNavigationMenuPortalContext() {
  const value = useContext(NavigationMenuPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <NavigationMenu.Portal> is missing.');
  }
  return value;
}
