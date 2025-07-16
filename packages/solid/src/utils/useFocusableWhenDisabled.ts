'use client';

import { type Accessor, createMemo, mergeProps } from 'solid-js';

export function useFocusableWhenDisabled(
  parameters: useFocusableWhenDisabled.Parameters,
): useFocusableWhenDisabled.ReturnValue {
  const merged = mergeProps(
    { composite: () => false, tabIndex: () => 0 } as useFocusableWhenDisabled.Parameters,
    parameters,
  );
  const isFocusableComposite = () =>
    merged.composite?.() && merged.focusableWhenDisabled?.() !== false;
  const isNonFocusableComposite = () =>
    merged.composite?.() && merged.focusableWhenDisabled?.() === false;

  // we can't explicitly assign `undefined` to any of these props because it
  // would otherwise prevent subsequently merged props from setting them
  const props = createMemo(() => {
    const additionalProps = {
      // allow Tabbing away from focusableWhenDisabled elements
      onKeyDown(event: KeyboardEvent) {
        if (merged.disabled?.() && merged.focusableWhenDisabled?.() && event.key !== 'Tab') {
          event.preventDefault();
        }
      },
    } as FocusableWhenDisabledProps;

    if (!merged.composite?.()) {
      additionalProps.tabIndex = merged.tabIndex?.() ?? 0;

      if (!merged.isNativeButton?.() && merged.disabled?.()) {
        additionalProps.tabIndex = merged.focusableWhenDisabled?.() ? merged.tabIndex!()! : -1;
      }
    }

    if (
      (merged.isNativeButton?.() && (merged.focusableWhenDisabled?.() || isFocusableComposite())) ||
      (!merged.isNativeButton?.() && merged.disabled?.())
    ) {
      additionalProps['aria-disabled'] = merged.disabled?.();
    }

    if (
      merged.isNativeButton?.() &&
      (!merged.focusableWhenDisabled?.() || isNonFocusableComposite())
    ) {
      additionalProps.disabled = merged.disabled?.();
    }

    return additionalProps;
  });

  return { props };
}

interface FocusableWhenDisabledProps {
  'aria-disabled'?: boolean;
  disabled?: boolean;
  onKeyDown: (event: KeyboardEvent) => void;
  tabIndex: number;
}

export namespace useFocusableWhenDisabled {
  export interface Parameters {
    /**
     * Whether the component should be focusable when disabled.
     * When `undefined`, composite items are focusable when disabled by default.
     */
    focusableWhenDisabled?: Accessor<boolean | undefined>;
    /**
     * The disabled state of the component.
     */
    disabled: Accessor<boolean>;
    /**
     * Whether this is a composite item or not.
     * @default false
     */
    composite?: Accessor<boolean | undefined>;
    /**
     * @default 0
     */
    tabIndex?: Accessor<number | undefined>;
    /**
     * @default true
     */
    isNativeButton: Accessor<boolean>;
  }

  export interface ReturnValue {
    props: Accessor<FocusableWhenDisabledProps>;
  }
}
