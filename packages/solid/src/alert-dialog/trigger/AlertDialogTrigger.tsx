'use client';
import { createMemo } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';

/**
 * A button that opens the alert dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export function AlertDialogTrigger(componentProps: AlertDialogTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const disabled = () => access(local.disabled) ?? false;
  const native = () => access(local.nativeButton) ?? true;

  const { open, setTriggerElement, triggerProps } = useAlertDialogRootContext();

  const state = createMemo<AlertDialogTrigger.State>(() => ({
    disabled: disabled(),
    open: open(),
  }));

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native,
  });

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
        setTriggerElement(el);
      }}
      params={{
        state: state(),
        props: [triggerProps(), elementProps, getButtonProps],
        customStyleHookMapping: triggerOpenStateMapping,
      }}
    />
  );
}

export namespace AlertDialogTrigger {
  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
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
