'use client';
import { createEffect, splitProps, type ComponentProps, type JSX } from 'solid-js';
import { useCompositeRootContext } from '../composite/root/CompositeRootContext';
import { makeEventPreventable, mergeProps } from '../merge-props';
import { access, callEventHandler, type MaybeAccessor, type ReactLikeRef } from '../solid-helpers';
import { HTMLProps, type BaseUIEvent } from '../utils/types';
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

  // TODO: fix typing and explain this
  function unpackHandlers<T extends Record<string, unknown>>(
    handlers: T,
    handlerItem: <E extends Event | BaseUIEvent<Event>>(data: {
      event: E;
      handler: any;
      handlerKey: keyof T;
    }) => void,
  ): Record<keyof T, any> {
    return Object.entries(handlers).reduce(
      (acc, [handlerKey, handlerFn]: [keyof T, any]) => {
        acc[handlerKey] = (event: any) =>
          handlerItem({ event, handler: handlerFn as any, handlerKey });
        return acc;
      },
      {} as Record<keyof T, any>,
    );
  }

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

  // TODO: fix typing in the whole function
  function getButtonProps(externalProps: GenericButtonProps = {}) {
    const [
      clickHandlers,
      mouseDownHandlers,
      keyUpHandlers,
      keyDownHandlers,
      pointerDownHandlers,
      otherExternalProps,
    ] = splitProps(
      externalProps,
      ['onClick', 'onclick', 'on:click'],
      ['onMouseDown', 'onmousedown', 'on:mousedown'],
      ['onKeyUp', 'onkeyup', 'on:keyup'],
      ['onKeyDown', 'onkeydown', 'on:keydown'],
      ['onPointerDown', 'onpointerdown', 'on:pointerdown'],
    );

    const unpackedClickHandlers = unpackHandlers(clickHandlers, ({ event, handler }) => {
      if (disabled()) {
        event.preventDefault();
        return;
      }
      callEventHandler(handler, event as any);
    });

    const unpackedMouseDownHandlers = unpackHandlers(mouseDownHandlers, ({ event, handler }) => {
      if (!disabled()) {
        callEventHandler(handler as any, event as any);
      }
    });

    const unpackedKeyDownHandlers = unpackHandlers(keyDownHandlers, ({ event, handler }) => {
      if (!disabled()) {
        makeEventPreventable(event as any);
        callEventHandler(handler as any, event as any);
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
        // TODO: probably not the best way to do this
        const clickHandler = Object.values(unpackedClickHandlers)[0];
        clickHandler?.(event as any);
        event.preventDefault();
      }
    });

    const unpackedKeyUpHandlers = unpackHandlers(keyUpHandlers, ({ event, handler }) => {
      // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
      // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
      // Keyboard accessibility for non interactive elements
      if (!disabled()) {
        makeEventPreventable(event as any);
        callEventHandler(handler as any, event as any);
      }

      if ((event as any).baseUIHandlerPrevented) {
        return;
      }

      if (
        event.target === event.currentTarget &&
        !isNativeButton() &&
        !disabled() &&
        (event as any).key === ' '
      ) {
        // TODO: fix this
        const clickHandler = Object.values(unpackedClickHandlers)[0];
        clickHandler?.(event as any);
      }
    });

    const unpackedPointerDownHandlers = unpackHandlers(
      pointerDownHandlers,
      ({ event, handler }) => {
        if (disabled()) {
          event.preventDefault();
          return;
        }
        callEventHandler(handler as any, event as any);
      },
    );

    const type = isNativeButton() ? 'button' : undefined;

    return mergeProps<'button'>(
      {
        type,
        ...unpackedClickHandlers,
        ...unpackedMouseDownHandlers,
        ...unpackedKeyDownHandlers,
        ...unpackedKeyUpHandlers,
        ...unpackedPointerDownHandlers,
      },
      !isNativeButton() ? { role: 'button' } : undefined,
      focusableWhenDisabledProps(),
      otherExternalProps,
    );
  }

  return {
    getButtonProps,
    buttonRef: (value) => {
      buttonRef = value;
    },
  };
}

interface GenericButtonProps
  extends Omit<HTMLProps, 'onClick' | 'on:click'>,
    AdditionalButtonProps {
  onClick?: (event: MouseEvent) => void;
  'on:click'?: (event: MouseEvent) => void;
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
