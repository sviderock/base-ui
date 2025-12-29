'use client';
import { type JSX } from 'solid-js';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
  const disabledProp = () => local.disabled ?? false;
  const native = () => local.nativeButton ?? true;

  const { panelId, open, handleTrigger, disabled: contextDisabled } = useCollapsibleRootContext();

  const disabled = () => disabledProp() ?? contextDisabled();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native,
  });

  const { state, triggerId: id } = useAccordionItemContext();

  const props: JSX.HTMLAttributes<HTMLButtonElement> = {
    get 'aria-controls'() {
      return open() ? panelId() : undefined;
    },
    get 'aria-expanded'() {
      return open();
    },
    // @ts-expect-error - disabled is not a valid attribute for a button
    get disabled() {
      return disabled();
    },
    get id() {
      return id?.();
    },
    onClick: handleTrigger,
  };

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
    nativeButton?: boolean;
  }
}
