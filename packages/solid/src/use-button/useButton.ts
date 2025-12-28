'use client';
import { createEffect, splitProps, type ComponentProps, type JSX } from 'solid-js';
import { useCompositeRootContext } from '../composite/root/CompositeRootContext';
import { makeEventPreventable } from '../merge-props';
import { combineProps } from '../merge-props/combineProps';
import { access, callEventHandler, type MaybeAccessor } from '../solid-helpers';
import { HTMLProps } from '../utils/types';
import { useFocusableWhenDisabled } from '../utils/useFocusableWhenDisabled';

export function useButton(parameters: useButton.Parameters = {}): useButton.ReturnValue {
  const disabled = () => access(parameters.disabled) ?? false;
  const tabIndex = () => access(parameters.tabIndex) ?? 0;
  const isNativeButton = () => access(parameters.native) ?? true;
  const focusableWhenDisabled = () => access(parameters.focusableWhenDisabled);

  let buttonRef: HTMLButtonElement | HTMLAnchorElement | HTMLElement | undefined | null;

  const isCompositeItem = () => useCompositeRootContext(true) !== undefined;

  const isValidLink = () => {
    return Boolean(buttonRef?.tagName === 'A' && (buttonRef as HTMLAnchorElement)?.href);
  };

  const { props: focusableWhenDisabledProps } = useFocusableWhenDisabled({
    focusableWhenDisabled,
    disabled,
    composite: isCompositeItem,
    tabIndex,
    isNativeButton,
  });

  // handles a disabled composite button rendering another button, e.g.
  // <Toolbar.Button disabled render={() => <Menu.Trigger />} />
  // the `disabled` prop needs to pass through 2 `useButton`s then finally
  // delete the `disabled` attribute from DOM
  createEffect(() => {
    const element = buttonRef;
    if (!(element instanceof HTMLButtonElement)) {
      return;
    }

    if (
      isCompositeItem() &&
      disabled() &&
      focusableWhenDisabledProps().disabled === undefined &&
      element.disabled
    ) {
      element.disabled = false;
    }
  });

  // TODO: fix typing in the whole function
  function getButtonProps(externalProps: GenericButtonProps = {}) {
    // Access event handlers directly instead of using splitProps, since externalProps
    // might be a proxy from combineProps and splitProps may not extract merged
    // callbacks correctly
    const externalOnClick = externalProps.onClick;
    const externalOnMouseDown = externalProps.onMouseDown;
    const externalOnKeyUp = externalProps.onKeyUp;
    const externalOnKeyDown = externalProps.onKeyDown;
    const externalOnPointerDown = externalProps.onPointerDown;

    const [, otherExternalProps] = splitProps(externalProps, [
      'onClick',
      'onMouseDown',
      'onKeyUp',
      'onKeyDown',
      'onPointerDown',
    ]);

    return combineProps<'button'>(
      {
        get type() {
          return isNativeButton() ? 'button' : undefined;
        },
        onClick(event) {
          if (disabled()) {
            event.preventDefault();
            return;
          }
          callEventHandler(externalOnClick, event);
        },
        onMouseDown(event) {
          if (!disabled()) {
            callEventHandler(externalOnMouseDown, event);
          }
        },
        onKeyDown(event) {
          if (!disabled()) {
            // TODO: fix typing
            makeEventPreventable(event);
            callEventHandler(externalOnKeyDown, event);
          }

          if ((event as any).baseUIHandlerPrevented) {
            return;
          }

          // Keyboard accessibility for non interactive elements
          if (
            event.target === event.currentTarget &&
            !isNativeButton() &&
            !isValidLink() &&
            (event as any).key === 'Enter' &&
            !disabled()
          ) {
            callEventHandler(externalOnClick, event as any);
            event.preventDefault();
          }
        },
        onKeyUp(event) {
          // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
          // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
          // Keyboard accessibility for non interactive elements
          if (!disabled()) {
            // TODO: fix typing
            makeEventPreventable(event as any);
            callEventHandler(externalOnKeyUp, event);
          }

          // TODO: fix typing
          if ((event as any).baseUIHandlerPrevented) {
            return;
          }

          if (
            event.target === event.currentTarget &&
            !isNativeButton() &&
            !disabled() &&
            event.key === ' '
          ) {
            // TODO: fix this
            callEventHandler(externalOnClick, event as any);
          }
        },
        onPointerDown(event) {
          if (disabled()) {
            event.preventDefault();
            return;
          }
          callEventHandler(externalOnPointerDown, event);
        },
      },
      focusableWhenDisabledProps(),
      otherExternalProps,
      {
        get role() {
          if (otherExternalProps.role) {
            return otherExternalProps.role;
          }
          return !isNativeButton() ? 'button' : undefined;
        },
      },
    );
  }

  return {
    getButtonProps,
    buttonRef: (value) => {
      buttonRef = value;
    },
  };
}

interface GenericButtonProps extends HTMLProps, AdditionalButtonProps {
  tabIndex?: number;
}

interface AdditionalButtonProps
  extends Partial<{
    'aria-disabled': JSX.AriaAttributes['aria-disabled'];
    disabled: boolean;
    role: JSX.AriaAttributes['role'];
    tabIndex?: number;
  }> {}

export namespace useButton {
  export interface Parameters {
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the button may receive focus even if it is disabled.
     * @default false
     */
    focusableWhenDisabled?: MaybeAccessor<boolean | undefined>;
    tabIndex?: MaybeAccessor<NonNullable<JSX.HTMLAttributes<any>['tabIndex']> | undefined>;
    /**
     * Whether the component is being rendered as a native button.
     * @default true
     */
    native?: MaybeAccessor<boolean | undefined>;
  }

  export interface ReturnValue {
    /**
     * Resolver for the button props.
     * @param externalProps additional props for the button
     * @returns props that should be spread on the button
     */
    getButtonProps: (externalProps?: ComponentProps<any>) => ComponentProps<any>;
    /**
     * A ref to the button DOM element. This ref should be passed to the rendered element.
     * It is not a part of the props returned by `getButtonProps`.
     */
    buttonRef: (
      value: HTMLButtonElement | HTMLAnchorElement | HTMLElement | null | undefined,
    ) => void;
  }
}
