'use client';

import { type Accessor, createMemo } from 'solid-js';
import { access, type MaybeAccessor } from '../solid-helpers';

export function useFocusableWhenDisabled(
  parameters: useFocusableWhenDisabled.Parameters,
): useFocusableWhenDisabled.ReturnValue {
  const focusableWhenDisabled = () => access(parameters.focusableWhenDisabled);
  const disabled = () => access(parameters.disabled);
  const composite = () => access(parameters.composite) ?? false;
  const tabIndexProp = () => access(parameters.tabIndex) ?? 0;
  const isNativeButton = () => access(parameters.isNativeButton);

  const isFocusableComposite = () => composite?.() && focusableWhenDisabled?.() !== false;
  const isNonFocusableComposite = () => composite?.() && focusableWhenDisabled?.() === false;

  // we can't explicitly assign `undefined` to any of these props because it
  // would otherwise prevent subsequently merged props from setting them
  const props = createMemo(() => {
    const additionalProps = {
      // allow Tabbing away from focusableWhenDisabled elements
      onKeyDown(event: KeyboardEvent) {
        if (disabled() && focusableWhenDisabled() && event.key !== 'Tab') {
          event.preventDefault();
        }
      },
    } as FocusableWhenDisabledProps;

    if (!composite()) {
      additionalProps.tabIndex = tabIndexProp();

      if (!isNativeButton() && disabled()) {
        additionalProps.tabIndex = focusableWhenDisabled() ? tabIndexProp()! : -1;
      }
    }

    if (
      (isNativeButton() && (focusableWhenDisabled() || isFocusableComposite())) ||
      (!isNativeButton() && disabled())
    ) {
      additionalProps['aria-disabled'] = disabled();
    }

    if (isNativeButton() && (!focusableWhenDisabled() || isNonFocusableComposite())) {
      additionalProps.disabled = disabled();
    }

    return additionalProps;
  });

  return { props };
}

interface FocusableWhenDisabledProps {
  'aria-disabled'?: boolean;
  disabled?: boolean;
  onKeyDown: (event: KeyboardEvent) => void;
  tabIndex: string | number;
}

export namespace useFocusableWhenDisabled {
  export interface Parameters {
    /**
     * Whether the component should be focusable when disabled.
     * When `undefined`, composite items are focusable when disabled by default.
     */
    focusableWhenDisabled?: MaybeAccessor<boolean | undefined>;
    /**
     * The disabled state of the component.
     */
    disabled: MaybeAccessor<boolean>;
    /**
     * Whether this is a composite item or not.
     * @default false
     */
    composite?: MaybeAccessor<boolean | undefined>;
    /**
     * @default 0
     */
    tabIndex?: MaybeAccessor<string | number | undefined>;
    /**
     * @default true
     */
    isNativeButton: MaybeAccessor<boolean>;
  }

  export interface ReturnValue {
    props: Accessor<FocusableWhenDisabledProps>;
  }
}
