'use client';
import { createMemo, mergeProps, splitProps, type JSX } from 'solid-js';
import { handleRef } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { CollapsibleRoot } from '../root/CollapsibleRoot';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';

const styleHookMapping: CustomStyleHookMapping<CollapsibleRoot.State> = {
  ...triggerOpenStateMapping,
  ...transitionStatusMapping,
};

/**
 * A button that opens and closes the collapsible panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export function CollapsibleTrigger(componentProps: CollapsibleTrigger.Props): JSX.Element {
  const context = useCollapsibleRootContext();

  const merged = mergeProps(
    { nativeButton: true, disabled: context.disabled() } satisfies CollapsibleTrigger.Props,
    componentProps,
  );
  const [local, elementProps] = splitProps(merged, [
    'class',
    'disabled',
    'id',
    'render',
    'nativeButton',
    'ref',
  ]);

  const button = useButton({
    disabled: () => local.disabled,
    focusableWhenDisabled: () => true,
    native: () => local.nativeButton,
  });

  const props = createMemo(() => ({
    'aria-controls': context.open() ? context.panelId() : undefined,
    'aria-expanded': context.open(),
    disabled: local.disabled,
    onClick: context.handleTrigger,
  }));

  return (
    <RenderElement
      element="button"
      componentProps={componentProps}
      ref={(el) => {
        handleRef(componentProps.ref, el);
        button.buttonRef(el);
      }}
      params={{
        state: context.state,
        props: [props(), elementProps, button.getButtonProps()],
        customStyleHookMapping: styleHookMapping,
      }}
    />
  );
}

export namespace CollapsibleTrigger {
  export interface Props extends BaseUIComponentProps<'button', CollapsibleRoot.State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
