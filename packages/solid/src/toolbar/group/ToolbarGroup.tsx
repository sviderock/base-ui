'use client';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { ToolbarGroupContext } from './ToolbarGroupContext';

/**
 * Groups several toolbar items or toggles.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export function ToolbarGroup(componentProps: ToolbarGroup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled']);
  const disabledProp = () => local.disabled ?? false;

  const { orientation, disabled: toolbarDisabled } = useToolbarRootContext();

  const disabled = () => toolbarDisabled() || disabledProp();

  const contextValue: ToolbarGroupContext = {
    disabled,
  };

  const state: ToolbarRoot.State = {
    get disabled() {
      return disabled();
    },
    get orientation() {
      return orientation();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: [{ role: 'group' }, elementProps],
  });

  return (
    <ToolbarGroupContext.Provider value={contextValue}>{element()}</ToolbarGroupContext.Provider>
  );
}

export namespace ToolbarGroup {
  export interface Props extends BaseUIComponentProps<'div', ToolbarRoot.State> {
    /**
     * When `true` all toolbar items in the group are disabled.
     * @default false
     */
    disabled?: boolean;
  }
}
