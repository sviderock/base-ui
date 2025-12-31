import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { CodependentRefs } from '../../solid-helpers';

export interface FieldsetRootContext {
  legendId: Accessor<string | undefined>;
  disabled: Accessor<boolean | undefined>;
  codependentRefs: Store<CodependentRefs<['legend']>>;
  setCodependentRefs: SetStoreFunction<CodependentRefs<['legend']>>;
}

export const FieldsetRootContext = createContext<FieldsetRootContext>({
  legendId: () => undefined,
  disabled: () => undefined,
  codependentRefs: {},
  setCodependentRefs: () => {},
});

export function useFieldsetRootContext() {
  return useContext(FieldsetRootContext);
}
