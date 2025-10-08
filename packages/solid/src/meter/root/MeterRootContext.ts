'use client';

import { createContext, useContext, type Accessor, type Setter } from 'solid-js';

export type MeterRootContext = {
  formattedValue: Accessor<string>;
  max: Accessor<number>;
  min: Accessor<number>;
  percentageValue: Accessor<number>;
  setLabelId: Setter<string | undefined>;
  value: Accessor<number>;
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
