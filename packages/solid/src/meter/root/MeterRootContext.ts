'use client';

import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { CodependentRefs } from '../../solid-helpers';

export type MeterRootContext = {
  formattedValue: Accessor<string>;
  max: Accessor<number>;
  min: Accessor<number>;
  percentageValue: Accessor<number>;
  value: Accessor<number>;
  codependentRefs: Store<CodependentRefs<['label']>>;
  setCodependentRefs: SetStoreFunction<CodependentRefs<['label']>>;
};

export const MeterRootContext = createContext<MeterRootContext>();

export function useMeterRootContext() {
  const context = useContext(MeterRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.',
    );
  }

  return context;
}
