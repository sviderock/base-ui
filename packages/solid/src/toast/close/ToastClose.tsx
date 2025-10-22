'use client';
import { createMemo } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useToastContext } from '../provider/ToastProviderContext';
import { useToastRootContext } from '../root/ToastRootContext';

/**
 * Closes the toast when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastClose(componentProps: ToastClose.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const disabled = () => access(local.disabled);
  const nativeButton = () => access(local.nativeButton) ?? true;

  const { close } = useToastContext();
  const { toast } = useToastRootContext();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state = createMemo<ToastClose.State>(() => ({ type: toast().type }));

  return (
    <RenderElement
      element="button"
      componentProps={componentProps}
      ref={(el) => {
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
        buttonRef(el);
      }}
      params={{
        state: state(),
        props: [
          {
            onClick() {
              close(toast().id);
            },
          },
          elementProps,
          getButtonProps,
        ],
      }}
    />
  );
}

export namespace ToastClose {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'disabled'> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the button is currently disabled.
     */
    disabled?: MaybeAccessor<boolean | undefined>;
  }
}
