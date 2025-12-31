import { mergeProps } from '../../merge-props';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import type { BaseUIHTMLProps, HTMLProps } from '../../utils/types';
import { DialogOpenChangeReason } from '../root/useDialogRoot';

export function useDialogClose(params: useDialogClose.Parameters): useDialogClose.ReturnValue {
  const open = () => access(params.open);
  const disabled = () => access(params.disabled);
  const native = () => access(params.nativeButton);

  const handleClick = (event: MouseEvent) => {
    if (open()) {
      params.setOpen(false, event, 'close-press');
    }
  };

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native,
  });

  const getRootProps: useDialogClose.ReturnValue['getRootProps'] = (externalProps) => {
    // Pass getButtonProps as a props-getter so it can wrap the previously merged
    // onClick and correctly suppress it when disabled, matching React behavior.
    return mergeProps({ onClick: handleClick }, externalProps, getButtonProps);
  };

  return {
    getRootProps,
    dialogCloseRef: buttonRef,
  };
}

export namespace useDialogClose {
  export interface Parameters {
    /**
     * Whether the button is currently disabled.
     */
    disabled: MaybeAccessor<boolean>;
    /**
     * Whether the dialog is currently open.
     */
    open: MaybeAccessor<boolean>;
    /**
     * Event handler called when the dialog is opened or closed.
     */
    setOpen: (
      open: boolean,
      event: Event | undefined,
      reason: DialogOpenChangeReason | undefined,
    ) => void;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton: MaybeAccessor<boolean>;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root element props.
     */
    getRootProps: (externalProps: HTMLProps | BaseUIHTMLProps) => BaseUIHTMLProps;
    dialogCloseRef: (el: HTMLElement | undefined | null) => void;
  }
}
