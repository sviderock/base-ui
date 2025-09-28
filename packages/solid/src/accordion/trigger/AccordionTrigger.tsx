'use client';
import { createEffect, createMemo, onCleanup, splitProps, type JSX } from 'solid-js';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { access, handleRef, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';

/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */

export function AccordionTrigger(componentProps: AccordionTrigger.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'class',
    'disabled',
    'id',
    'render',
    'nativeButton',
  ]);
  const disabledProp = () => access(local.disabled) ?? false;
  const idProp = () => access(local.id);
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
    if (idProp()) {
      setTriggerId(idProp());
    }

    onCleanup(() => {
      setTriggerId(undefined);
    });
  });

  const props = createMemo<JSX.HTMLAttributes<HTMLButtonElement>>(() => ({
    'aria-controls': open() ? panelId() : undefined,
    'aria-expanded': open(),
    disabled: disabled(),
    id: id?.(),
    onClick: handleTrigger,
  }));

  return (
    <RenderElement
      element="button"
      componentProps={componentProps}
      ref={(el) => {
        handleRef(componentProps.ref, el);
        buttonRef(el);
      }}
      params={{
        state: state(),
        props: [props(), elementProps, getButtonProps],
        customStyleHookMapping: triggerOpenStateMapping,
      }}
    />
  );
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
