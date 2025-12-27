'use client';
import { batch, createMemo } from 'solid-js';
import { type MaybeAccessor, access, splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import {
  pressableTriggerOpenStateMapping,
  triggerOpenStateMapping,
} from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { usePopoverRootContext } from '../root/PopoverRootContext';

/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverTrigger(componentProps: PopoverTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const disabled = () => local.disabled ?? false;
  const nativeButton = () => local.nativeButton ?? true;

  const { open, setTriggerElement, triggerProps, openReason } = usePopoverRootContext();

  const state: PopoverTrigger.State = {
    get disabled() {
      return disabled();
    },
    get open() {
      return open();
    },
  };

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  //   open { value: false, openReason: 'trigger-press' }
  // open { value: false, openReason: 'trigger-press' }
  // open { value: false, openReason: null }
  // open { value: false, openReason: null }

  const customStyleHookMapping: CustomStyleHookMapping<{ open: MaybeAccessor<boolean> }> = {
    open(value) {
      const val = access(value);
      if (val && openReason() === 'trigger-press') {
        return pressableTriggerOpenStateMapping.open(val);
      }

      return triggerOpenStateMapping.open(val);
    },
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: (el) => {
      batch(() => {
        buttonRef(el);
        setTriggerElement(el);
      });
    },
    props: [triggerProps, elementProps, getButtonProps],
    customStyleHookMapping,
  });

  return <>{element()}</>;
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
    nativeButton?: boolean;
  }
}
