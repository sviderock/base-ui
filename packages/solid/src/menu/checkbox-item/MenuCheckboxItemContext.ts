import { createContext, useContext, type Accessor } from 'solid-js';

export interface MenuCheckboxItemContext {
  checked: Accessor<boolean>;
  highlighted: Accessor<boolean>;
  disabled: Accessor<boolean>;
}

export const MenuCheckboxItemContext = createContext<MenuCheckboxItemContext>();

export function useMenuCheckboxItemContext() {
  const context = useContext(MenuCheckboxItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuCheckboxItemContext is missing. MenuCheckboxItem parts must be placed within <Menu.CheckboxItem>.',
    );
  }

  return context;
}
