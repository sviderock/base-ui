'use client';
import { ComponentProps, createMemo, Show, splitProps } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useToastRootContext } from '../root/ToastRootContext';

/**
 * Performs an action when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastAction(componentProps: ToastAction.Props) {
  const [renderProps, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'nativeButton',
  ]);
  const disabled = () => access(local.disabled);
  const nativeButton = () => access(local.nativeButton) ?? true;

  const { toast } = useToastRootContext();

  const toastActionProps = createMemo<ComponentProps<'button'>>(() => {
    const actionProps = toast().actionProps;
    if (!actionProps) {
      return {};
    }

    const [, otherProps] = splitProps(actionProps, ['children']);
    return otherProps;
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state = createMemo<ToastAction.State>(() => ({
    type: toast().type,
  }));

  return (
    <Show when={Boolean(toast().actionProps?.children ?? componentProps.children)}>
      <RenderElement
        element="button"
        componentProps={{
          render: renderProps.render,
          class: renderProps.class,
        }}
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
          props: [elementProps, toastActionProps(), getButtonProps],
        }}
      >
        {toast().actionProps?.children ?? componentProps.children}
      </RenderElement>
    </Show>
  );
}

export namespace ToastAction {
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
