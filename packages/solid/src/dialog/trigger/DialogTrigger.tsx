'use client';
import { access, splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDialogRootContext } from '../root/DialogRootContext';

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogTrigger(componentProps: DialogTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'render',
    'class',
    'disabled',
    'nativeButton',
  ]);
  const disabled = () => access(local.disabled) ?? false;
  const native = () => access(local.nativeButton) ?? true;

  const { open, setTriggerElement, triggerProps } = useDialogRootContext();

  const state: DialogTrigger.State = {
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

export namespace DialogTrigger {
  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
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
