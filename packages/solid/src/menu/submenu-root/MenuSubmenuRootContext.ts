import { createContext, useContext } from 'solid-js';

export const MenuSubmenuRootContext = createContext<boolean>(false);

export function useMenuSubmenuRootContext(): boolean {
  return useContext(MenuSubmenuRootContext);
}
