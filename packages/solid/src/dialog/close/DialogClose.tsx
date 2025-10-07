'use client';
import { splitProps } from 'solid-js';
import { type MaybeAccessor } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useDialogClose } from './useDialogClose';

/**
 * A button that closes the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogClose(componentProps: DialogClose.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'disabled',
    'nativeButton',
  ]);
  const disabled = () => local.disabled ?? false;
  const nativeButton = () => local.nativeButton ?? true;

  const { open, setOpen } = useDialogRootContext();
  const { getRootProps, dialogCloseRef } = useDialogClose({
    disabled,
    open,
    setOpen,
    nativeButton,
  });

  const state: DialogClose.State = { disabled };

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
        dialogCloseRef(el);
      }}
      params={{
        state,
        props: [elementProps, getRootProps],
      }}
    />
  );
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
    disabled: MaybeAccessor<boolean>;
  }
}
