import { createContext, useContext, type Accessor } from 'solid-js';

export interface MenuRadioItemContext {
  checked: Accessor<boolean>;
  highlighted: Accessor<boolean>;
  disabled: Accessor<boolean>;
}

export const MenuRadioItemContext = createContext<MenuRadioItemContext>();

export function useMenuRadioItemContext() {
  const context = useContext(MenuRadioItemContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuRadioItemContext is missing. MenuRadioItem parts must be placed within <Menu.RadioItem>.',
    );
  }

  return context;
}
