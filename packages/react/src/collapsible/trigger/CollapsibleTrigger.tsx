'use client';
import * as React from 'react';
import { useButton } from '../../use-button';
import { triggerOpenStateMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
export const CollapsibleTrigger = React.forwardRef(function CollapsibleTrigger(
  componentProps: CollapsibleTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    panelId,
    open,
    handleTrigger,
    state,
    disabled: contextDisabled,
  } = useCollapsibleRootContext();

  const {
    className,
    disabled = contextDisabled,
    id,
    render,
    nativeButton = true,
    ...elementProps
  } = componentProps;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const props = React.useMemo(
    () => ({
      'aria-controls': open ? panelId : undefined,
      'aria-expanded': open,
      disabled,
      onClick: handleTrigger,
    }),
    [panelId, disabled, open, handleTrigger],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [props, elementProps, getButtonProps],
    customStyleHookMapping: styleHookMapping,
  });

  return element;
});

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
