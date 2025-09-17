'use client';
import { createEffect, type ComponentProps, type JSX } from 'solid-js';
import { useCompositeRootContext } from '../composite/root/CompositeRootContext';
import { makeEventPreventable, mergeProps } from '../merge-props';
import { access, callEventHandler, type MaybeAccessor } from '../solid-helpers';
import { HTMLProps } from '../utils/types';
import { useFocusableWhenDisabled } from '../utils/useFocusableWhenDisabled';

export function useButton(parameters: useButton.Parameters = {}): useButton.ReturnValue {
  const disabled = () => access(parameters.disabled) ?? false;
  const tabIndex = () => access(parameters.tabIndex) ?? 0;
  const isNativeButton = () => access(parameters.native) ?? true;
  const focusableWhenDisabled = () => access(parameters.focusableWhenDisabled);

  let buttonRef = null as HTMLButtonElement | HTMLAnchorElement | HTMLElement | null;

  const isCompositeItem = () => useCompositeRootContext(true) !== undefined;

  const isValidLink = () => {
    const element = buttonRef;
    return Boolean(element?.tagName === 'A' && (element as HTMLAnchorElement)?.href);
  };

  const { props: focusableWhenDisabledProps } = useFocusableWhenDisabled({
    focusableWhenDisabled,
    disabled,
    composite: isCompositeItem,
    tabIndex,
    isNativeButton,
  });

  // handles a disabled composite button rendering another button, e.g.
  // <Toolbar.Button disabled render={<Menu.Trigger />} />
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

  function getButtonProps(externalProps: GenericButtonProps = {}) {
    const {
      onClick: externalOnClick,
      onMouseDown: externalOnMouseDown,
      onKeyUp: externalOnKeyUp,
      onKeyDown: externalOnKeyDown,
      onPointerDown: externalOnPointerDown,
      ...otherExternalProps
    } = externalProps;

    const type = isNativeButton() ? 'button' : undefined;

    return mergeProps<'button'>(
      {
        type,
        onClick(event) {
          if (disabled()) {
            event.preventDefault();
            return;
          }
          externalOnClick?.(event);
        },
        onMouseDown(event) {
          if (!disabled()) {
            callEventHandler(externalOnMouseDown, event);
          }
        },
        onKeyDown(event) {
          if (!disabled()) {
            makeEventPreventable(event);
            callEventHandler(externalOnKeyDown, event);
          }

          if (event.baseUIHandlerPrevented) {
            return;
          }

          // Keyboard accessibility for non interactive elements
          if (
            event.target === event.currentTarget &&
            !isNativeButton() &&
            !isValidLink() &&
            event.key === 'Enter' &&
            !disabled()
          ) {
            // TODO: fix this
            externalOnClick?.(event as unknown as MouseEvent);
            event.preventDefault();
          }
        },
        onKeyUp(event) {
          // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
          // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
          // Keyboard accessibility for non interactive elements
          if (!disabled()) {
            makeEventPreventable(event);
            callEventHandler(externalOnKeyUp, event);
          }

          if (event.baseUIHandlerPrevented) {
            return;
          }

          if (
            event.target === event.currentTarget &&
            !isNativeButton() &&
            !disabled() &&
            event.key === ' '
          ) {
            // TODO: fix this
            externalOnClick?.(event as unknown as MouseEvent);
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
      !isNativeButton() ? { role: 'button' } : undefined,
      focusableWhenDisabledProps(),
      otherExternalProps,
    );
  }

  return {
    getButtonProps,
    buttonRef,
  };
}

interface GenericButtonProps extends Omit<HTMLProps, 'onClick'>, AdditionalButtonProps {
  onClick?: (event: MouseEvent) => void;
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
    buttonRef: HTMLElement | null | undefined;
  }
}
