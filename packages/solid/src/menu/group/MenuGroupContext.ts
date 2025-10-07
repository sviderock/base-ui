import { createContext, useContext, type Setter } from 'solid-js';

export interface MenuGroupContext {
  setLabelId: Setter<string | undefined>;
}

export const MenuGroupContext = createContext<MenuGroupContext | undefined>(undefined);

export function useMenuGroupRootContext() {
  const context = useContext(MenuGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuGroupRootContext is missing. Menu group parts must be used within <Menu.Group>.',
    );
  }

  return context;
}
