'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useDialogClose } from './useDialogClose';

/**
 * A button that closes the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogClose(componentProps: DialogClose.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const disabled = () => local.disabled ?? false;
  const nativeButton = () => local.nativeButton ?? true;

  const { open, setOpen } = useDialogRootContext();
  const { getRootProps, dialogCloseRef } = useDialogClose({
    disabled,
    open,
    setOpen,
    nativeButton,
  });

  const state: DialogClose.State = {
    get disabled() {
      return disabled();
    },
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: dialogCloseRef,
    props: [elementProps, getRootProps],
  });

  return <>{element()}</>;
}

export namespace DialogClose {
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
     * Whether the button is currently disabled.
     */
    disabled: boolean;
  }
}
