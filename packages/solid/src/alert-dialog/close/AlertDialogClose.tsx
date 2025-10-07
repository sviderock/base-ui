'use client';
import { splitProps } from 'solid-js';
import { useDialogClose } from '../../dialog/close/useDialogClose';
import { type MaybeAccessor, access } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 * A button that closes the alert dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogClose(componentProps: AlertDialogClose.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'disabled',
    'nativeButton',
  ]);
  const disabled = () => access(local.disabled) ?? false;
  const nativeButton = () => access(local.nativeButton) ?? true;

  const { open, setOpen } = useAlertDialogRootContext();
  const { getRootProps, dialogCloseRef } = useDialogClose({
    disabled,
    open,
    setOpen,
    nativeButton,
  });

  const state: AlertDialogClose.State = { disabled };

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
      params={{ state, props: [elementProps, getRootProps] }}
    />
  );
}

export namespace AlertDialogClose {
  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }

  export interface State {
    /**
     * Whether the button is currently disabled.
     */
    disabled: MaybeAccessor<boolean>;
  }
}
