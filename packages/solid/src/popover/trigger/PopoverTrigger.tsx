'use client';
import { createMemo } from 'solid-js';
import { type MaybeAccessor, access, splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import {
  pressableTriggerOpenStateMapping,
  triggerOpenStateMapping,
} from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { usePopoverRootContext } from '../root/PopoverRootContext';

/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverTrigger(componentProps: PopoverTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const disabled = () => access(local.disabled) ?? false;
  const nativeButton = () => access(local.nativeButton) ?? true;

  const { open, setTriggerElement, triggerProps, openReason } = usePopoverRootContext();

  const state = createMemo<PopoverTrigger.State>(() => ({
    disabled: disabled(),
    open: open(),
  }));

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const customStyleHookMapping = createMemo<
    CustomStyleHookMapping<{ open: MaybeAccessor<boolean> }>
  >(() => ({
    open(value) {
      const val = access(value);
      if (val && openReason() === 'trigger-press') {
        return pressableTriggerOpenStateMapping.open(val);
      }

      return triggerOpenStateMapping.open(val);
    },
  }));

  return (
    <RenderElement
      element="button"
      componentProps={componentProps}
      ref={(el) => {
        buttonRef(el);
        setTriggerElement(el);
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{
        state: state(),
        props: [triggerProps(), elementProps, getButtonProps],
        customStyleHookMapping: customStyleHookMapping(),
      }}
    />
  );
}

export namespace PopoverTrigger {
  export interface State {
    /**
     * Whether the popover is currently disabled.
     */
    disabled: boolean;
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }
}
