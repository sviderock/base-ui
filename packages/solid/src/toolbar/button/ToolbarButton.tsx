'use client';
import { createMemo } from 'solid-js';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';

/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export function ToolbarButton(componentProps: ToolbarButton.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'focusableWhenDisabled',
    'nativeButton',
  ]);
  const disabledProp = () => local.disabled ?? false;
  const focusableWhenDisabled = () => local.focusableWhenDisabled ?? true;
  const nativeButton = () => local.nativeButton ?? true;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const itemMetadata = createMemo(() => ({ focusableWhenDisabled: focusableWhenDisabled() }));

  const disabled = () => toolbarDisabled() || (groupContext?.disabled() ?? false) || disabledProp();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
  });

  const state: ToolbarButton.State = {
    get disabled() {
      return disabled();
    },
    get orientation() {
      return orientation();
    },
    get focusable() {
      return focusableWhenDisabled();
    },
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: buttonRef,
    props: [
      elementProps,
      // for integrating with Menu and Select disabled states, `disabled` is
      // intentionally duplicated even though getButtonProps includes it already
      // TODO: follow up after https://github.com/mui/base-ui/issues/1976#issuecomment-2916905663
      {
        get disabled() {
          return disabled();
        },
      },
      getButtonProps,
    ],
  });

  return <CompositeItem<ToolbarRoot.ItemMetadata> metadata={itemMetadata} render={element} />;
}

export namespace ToolbarButton {
  export interface State extends ToolbarRoot.State {
    disabled: boolean;
    focusable: boolean;
  }

  export interface Props
    extends Omit<BaseUIComponentProps<'button', ToolbarRoot.State>, 'disabled'> {
    /**
     * When `true` the item is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * When `true` the item remains focuseable when disabled.
     * @default true
     */
    focusableWhenDisabled?: boolean;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
