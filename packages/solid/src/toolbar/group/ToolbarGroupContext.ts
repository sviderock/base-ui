import { createContext, useContext, type Accessor } from 'solid-js';

export interface ToolbarGroupContext {
  disabled: Accessor<boolean>;
}

export const ToolbarGroupContext = createContext<ToolbarGroupContext | undefined>(undefined);

export function useToolbarGroupContext(optional?: false): ToolbarGroupContext;
export function useToolbarGroupContext(optional: true): ToolbarGroupContext | undefined;
export function useToolbarGroupContext(optional?: boolean) {
  const context = useContext(ToolbarGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToolbarGroupContext is missing. ToolbarGroup parts must be placed within <Toolbar.Group>.',
    );
  }
  return context;
}
