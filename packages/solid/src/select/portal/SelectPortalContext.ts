import { createContext, useContext } from 'solid-js';
import { type MaybeAccessor } from '../../solid-helpers';

export const SelectPortalContext = createContext<MaybeAccessor<boolean>>();

export function useSelectPortalContext() {
  const value = useContext(SelectPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Select.Portal> is missing.');
  }
  return value;
}
