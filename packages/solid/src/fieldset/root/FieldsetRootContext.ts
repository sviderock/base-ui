'use client';
import { createContext, useContext, type Accessor } from 'solid-js';

export interface FieldsetRootContext {
  legendId: Accessor<string | undefined>;
  setLegendId: (id: string | undefined) => void;
  disabled: Accessor<boolean | undefined>;
}

export const FieldsetRootContext = createContext<FieldsetRootContext>({
  legendId: () => undefined,
  setLegendId: () => {},
  disabled: () => undefined,
});

export function useFieldsetRootContext() {
  return useContext(FieldsetRootContext);
}
