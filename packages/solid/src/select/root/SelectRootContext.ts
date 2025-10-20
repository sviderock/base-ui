import { createContext, useContext, type Accessor } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import type { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFloatingRootContext, type FloatingRootContext } from '../../floating-ui-solid';
import type { HTMLProps } from '../../utils/types';
import type { Timeout } from '../../utils/useTimeout';
import type { SelectStore } from '../store';
import type { SelectOpenChangeReason } from './useSelectRoot';

export interface SelectRootContext {
  store: Store<SelectStore>;
  setStore: SetStoreFunction<SelectStore>;
  selectors: {
    isActive: (index: number) => boolean;
    isSelected: (data: [index: number, value: any]) => boolean;
  };
  name: Accessor<string | undefined>;
  disabled: Accessor<boolean>;
  readOnly: Accessor<boolean>;
  required: Accessor<boolean>;
  setValue: (nextValue: any, event?: Event) => void;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: SelectOpenChangeReason | undefined,
  ) => void;
  refs: {
    listRef: Array<HTMLElement | null | undefined>;
    popupRef: HTMLDivElement | null | undefined;
    valueRef: HTMLSpanElement | null | undefined;
    valuesRef: Array<any>;
    labelsRef: Array<string | null>;
    typingRef: boolean;
    selectedItemTextRef: HTMLSpanElement | null | undefined;
    keyboardActiveRef: boolean;
    alignItemWithTriggerActiveRef: boolean;
    selectionRef: {
      allowUnselectedMouseUp: boolean;
      allowSelectedMouseUp: boolean;
      allowSelect: boolean;
    };
  };
  getItemProps: (
    props?: HTMLProps & { active?: boolean; selected?: boolean },
  ) => Record<string, unknown>; // PREVENT_COMMIT
  events: ReturnType<typeof useFloatingRootContext>['events'];

  fieldControlValidation: ReturnType<typeof useFieldControlValidation>;
  registerSelectedItem: (index: number) => void;
  onOpenChangeComplete?: (open: boolean) => void;

  highlightTimeout: Timeout;
}

export const SelectRootContext = createContext<SelectRootContext | null>(null);
export const SelectFloatingContext = createContext<FloatingRootContext | null>(null);

export function useSelectRootContext() {
  const context = useContext(SelectRootContext);
  if (context === null) {
    throw new Error(
      'Base UI: SelectRootContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return context;
}

export function useSelectFloatingContext() {
  const context = useContext(SelectFloatingContext);
  if (context === null) {
    throw new Error(
      'Base UI: SelectFloatingContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }
  return context;
}
