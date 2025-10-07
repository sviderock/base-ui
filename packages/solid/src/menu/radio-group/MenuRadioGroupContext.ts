import { createContext, useContext, type Accessor } from 'solid-js';

export interface MenuRadioGroupContext {
  value: Accessor<any>;
  setValue: (newValue: any, event: Event) => void;
  disabled: Accessor<boolean>;
}

export const MenuRadioGroupContext = createContext<MenuRadioGroupContext>();

export function useMenuRadioGroupContext() {
  const context = useContext(MenuRadioGroupContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MenuRadioGroupContext is missing. MenuRadioGroup parts must be placed within <Menu.RadioGroup>.',
    );
  }

  return context;
}
