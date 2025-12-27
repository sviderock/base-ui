'use client';
import { splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 * A button that opens the alert dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogTrigger(componentProps: AlertDialogTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const disabled = () => local.disabled ?? false;
  const native = () => local.nativeButton ?? true;

  const { open, setTriggerElement, triggerProps } = useAlertDialogRootContext();

  const state: AlertDialogTrigger.State = {
    get disabled() {
      return disabled();
    },
    get open() {
      return open();
    },
  };

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native,
  });

  const element = useRenderElement('button', componentProps, {
    state,
    ref: (el) => {
      buttonRef(el);
      setTriggerElement(el);
    },
    props: [triggerProps, elementProps, getButtonProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return <>{element()}</>;
}

export namespace AlertDialogTrigger {
  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: boolean;
  }

  export interface State {
    /**
     * Whether the dialog is currently disabled.
     */
    disabled: boolean;
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
  }
}
