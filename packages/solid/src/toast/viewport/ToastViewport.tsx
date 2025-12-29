'use client';
import { createEffect, onCleanup, type JSX } from 'solid-js';
import { activeElement, contains, getTarget } from '../../floating-ui-solid/utils';
import { splitComponentProps } from '../../solid-helpers';
import { FocusGuard } from '../../utils/FocusGuard';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useToastContext } from '../provider/ToastProviderContext';
import { isFocusVisible } from '../utils/focusVisible';
import { ToastViewportContext } from './ToastViewportContext';

/**
 * A container viewport for toasts.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastViewport(componentProps: ToastViewport.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const {
    toasts,
    pauseTimers,
    resumeTimers,
    setHovering,
    setFocused,
    refs,
    prevFocusElement,
    setPrevFocusElement,
    hovering,
    focused,
    hasDifferingHeights,
  } = useToastContext();

  let handlingFocusGuardRef = false;
  const numToasts = () => toasts.list.length;

  // Listen globally for F6 so we can force-focus the viewport.
  createEffect(() => {
    if (!refs.viewportRef) {
      return;
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (numToasts() === 0) {
        return;
      }

      if (event.key === 'F6' && event.target !== refs.viewportRef) {
        event.preventDefault();
        setPrevFocusElement(activeElement(ownerDocument(refs.viewportRef)) as HTMLElement | null);
        refs.viewportRef?.focus();
        pauseTimers();
        setFocused(true);
      }
    }

    const win = ownerWindow(refs.viewportRef);

    win.addEventListener('keydown', handleGlobalKeyDown);

    onCleanup(() => {
      win.removeEventListener('keydown', handleGlobalKeyDown);
    });
  });

  createEffect(() => {
    if (!refs.viewportRef || !numToasts()) {
      return;
    }

    const win = ownerWindow(refs.viewportRef);

    function handleWindowBlur(event: FocusEvent) {
      if (event.target !== win) {
        return;
      }

      refs.windowFocusedRef = false;
      pauseTimers();
    }

    function handleWindowFocus(event: FocusEvent) {
      if (event.relatedTarget || event.target === win) {
        return;
      }

      const target = getTarget(event);
      const activeEl = activeElement(ownerDocument(refs.viewportRef));
      if (!contains(refs.viewportRef, target as HTMLElement | null) || !isFocusVisible(activeEl)) {
        resumeTimers();
      }

      // Wait for the `handleFocus` event to fire.
      setTimeout(() => {
        refs.windowFocusedRef = true;
      });
    }

    win.addEventListener('blur', handleWindowBlur, true);
    win.addEventListener('focus', handleWindowFocus, true);

    onCleanup(() => {
      win.removeEventListener('blur', handleWindowBlur, true);
      win.removeEventListener('focus', handleWindowFocus, true);
    });
  });

  function handleFocusGuard(event: FocusEvent) {
    if (!refs.viewportRef) {
      return;
    }

    handlingFocusGuardRef = true;

    // If we're coming off the container, move to the first toast
    if (event.relatedTarget === refs.viewportRef) {
      toasts.list[0]?.ref?.focus();
    } else {
      prevFocusElement()?.focus({ preventScroll: true });
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab' && event.shiftKey && event.target === refs.viewportRef) {
      event.preventDefault();
      prevFocusElement()?.focus({ preventScroll: true });
      resumeTimers();
    }
  }

  function handleMouseEnter() {
    pauseTimers();
    setHovering(true);
  }

  function handleMouseLeave() {
    const activeEl = activeElement(ownerDocument(refs.viewportRef));
    if (contains(refs.viewportRef, activeEl) && isFocusVisible(activeEl)) {
      return;
    }

    resumeTimers();
    setHovering(false);
  }

  function handleFocus() {
    if (handlingFocusGuardRef) {
      handlingFocusGuardRef = false;
      return;
    }

    if (focused()) {
      return;
    }

    // If the window was previously blurred, the focus must be visible to
    // pause the timers, since for pointers it's unexpected that focus is
    // considered inside the viewport at this point.
    const activeEl = activeElement(ownerDocument(refs.viewportRef));
    if (!refs.windowFocusedRef && !isFocusVisible(activeEl)) {
      return;
    }

    setFocused(true);
    pauseTimers();
  }

  function handleBlur(event: FocusEvent) {
    if (!focused() || contains(refs.viewportRef, event.relatedTarget as HTMLElement | null)) {
      return;
    }

    setFocused(false);
    resumeTimers();
  }

  const props: JSX.HTMLAttributes<HTMLDivElement> = {
    role: 'region',
    tabIndex: -1,
    get 'aria-label'() {
      return `${numToasts()} notification${numToasts() !== 1 ? 's' : ''} (F6)`;
    },
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onClick: handleFocus,
  };

  const state: ToastViewport.State = {
    get expanded() {
      return hovering() || focused() || hasDifferingHeights();
    },
  };

  const contextValue = { refs };

  // const children = createMemo(() => (
  //   <>
  //     {numToasts() > 0 && prevFocusElement() && <FocusGuard onFocus={handleFocusGuard} />}
  //     {componentProps.children}
  //     {numToasts() > 0 && prevFocusElement() && <FocusGuard onFocus={handleFocusGuard} />}
  //   </>
  // ));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      refs.viewportRef = el;
    },
    props: [props, elementProps],
    get children() {
      return (
        <>
          {numToasts() > 0 && prevFocusElement() && <FocusGuard onFocus={handleFocusGuard} />}
          {componentProps.children}
          {numToasts() > 0 && prevFocusElement() && <FocusGuard onFocus={handleFocusGuard} />}
        </>
      );
    },
  });

  return (
    <ToastViewportContext.Provider value={contextValue}>
      {numToasts() > 0 && prevFocusElement() && <FocusGuard onFocus={handleFocusGuard} />}
      {element()}
    </ToastViewportContext.Provider>
  );
}

export namespace ToastViewport {
  export interface State {
    /**
     * Whether toasts are expanded in the viewport.
     */
    expanded: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
