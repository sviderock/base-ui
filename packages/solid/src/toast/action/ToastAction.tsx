'use client';
import { combineProps } from '../../merge-props';
import { splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useToastRootContext } from '../root/ToastRootContext';

/**
 * Performs an action when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastAction(componentProps: ToastAction.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const nativeButton = () => local.nativeButton ?? true;

  const { toast } = useToastRootContext();

  const { getButtonProps, buttonRef } = useButton({
    disabled: () => local.disabled,
    native: nativeButton,
  });

  const state: ToastAction.State = {
    get type() {
      return toast().type;
    },
  };

  const element = useRenderElement('button', componentProps, {
    enabled: () => Boolean(toast().actionProps?.children ?? componentProps.children),
    state,
    ref: buttonRef,
    props: [elementProps, (props) => combineProps(props, toast().actionProps), getButtonProps],
    get children() {
      return <>{toast().actionProps?.children ?? componentProps.children}</>;
    },
  });

  return <>{element()}</>;
}

export namespace ToastAction {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
