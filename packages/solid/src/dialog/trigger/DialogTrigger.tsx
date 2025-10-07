'use client';
import { splitProps, type JSX } from 'solid-js';
import { type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useDialogRootContext } from '../root/DialogRootContext';

/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export function DialogTrigger(componentProps: DialogTrigger.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'render',
    'class',
    'disabled',
    'nativeButton',
  ]);
  const disabled = () => local.disabled ?? false;
  const native = () => local.nativeButton ?? true;

  const { open, setTriggerElement, triggerProps } = useDialogRootContext();

  const state: DialogTrigger.State = {
    disabled,
    open,
  };

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
        state,
        props: [
          triggerProps,
          elementProps as JSX.HTMLAttributes<HTMLButtonElement>,
          getButtonProps,
        ],
        customStyleHookMapping: triggerOpenStateMapping,
      }}
    />
  );
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
    disabled: MaybeAccessor<boolean>;
    /**
     * Whether the dialog is currently open.
     */
    open: MaybeAccessor<boolean>;
  }
}
