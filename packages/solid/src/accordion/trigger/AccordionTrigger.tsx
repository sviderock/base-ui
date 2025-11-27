'use client';
import { createEffect, createMemo, onCleanup, type JSX } from 'solid-js';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';

/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */

export function AccordionTrigger(componentProps: AccordionTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'id',
    'nativeButton',
  ]);
  const disabledProp = () => access(local.disabled) ?? false;
  const native = () => access(local.nativeButton) ?? true;

  const { panelId, open, handleTrigger, disabled: contextDisabled } = useCollapsibleRootContext();

  const disabled = () => disabledProp() ?? contextDisabled();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native,
  });

  const { state, setTriggerId, triggerId: id } = useAccordionItemContext();

  createEffect(() => {
    if (local.id) {
      setTriggerId(local.id);

      onCleanup(() => {
        setTriggerId(undefined);
      });
    }
  });

  const props = createMemo<JSX.HTMLAttributes<HTMLButtonElement>>(() => ({
    'aria-controls': open() ? panelId() : undefined,
    'aria-expanded': open(),
    disabled: disabled(),
    id: id?.(),
    onClick: handleTrigger,
  }));

  const element = useRenderElement('button', componentProps, {
    state,
    ref: buttonRef,
    props: [props, elementProps, getButtonProps],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return <>{element()}</>;
}

export namespace AccordionTrigger {
  export interface Props extends BaseUIComponentProps<'button', AccordionItem.State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }
}
