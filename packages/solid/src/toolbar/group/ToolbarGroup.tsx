'use client';
import { createMemo } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
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
  const disabledProp = () => access(local.disabled) ?? false;

  const { orientation, disabled: toolbarDisabled } = useToolbarRootContext();

  const disabled = () => toolbarDisabled() || disabledProp();

  const contextValue: ToolbarGroupContext = {
    disabled,
  };

  const state = createMemo<ToolbarRoot.State>(() => ({
    disabled: disabled(),
    orientation: orientation(),
  }));

  return (
    <ToolbarGroupContext.Provider value={contextValue}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={componentProps.ref}
        params={{
          state: state(),
          props: [{ role: 'group' }, elementProps],
        }}
      />
    </ToolbarGroupContext.Provider>
  );
}

export namespace ToolbarGroup {
  export interface Props extends BaseUIComponentProps<'div', ToolbarRoot.State> {
    /**
     * When `true` all toolbar items in the group are disabled.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
  }
}
