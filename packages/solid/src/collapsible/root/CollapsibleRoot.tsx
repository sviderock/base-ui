'use client';
import { mergeProps, Show, splitProps } from 'solid-js';
import { BaseUIComponentProps } from '../../utils/types';
import { useForkRefN } from '../../utils/useForkRef';
import { RenderElement } from '../../utils/useRenderElement';
import { CollapsibleRootContext } from './CollapsibleRootContext';
import { collapsibleStyleHookMapping } from './styleHooks';
import { useCollapsibleRoot } from './useCollapsibleRoot';

/**
 * Groups all parts of the collapsible.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/solid/components/collapsible)
 */
export function CollapsibleRoot(componentProps: CollapsibleRoot.Props) {
  const merged = mergeProps(
    { defaultOpen: false, disabled: false } satisfies CollapsibleRoot.Props,
    componentProps,
  );
  const [local, elementProps] = splitProps(merged, [
    'class',
    'defaultOpen',
    'disabled',
    'onOpenChange',
    'open',
    'ref',
  ]);

  const onOpenChange = (open: boolean) => {
    local.onOpenChange?.(open);
  };

  const collapsible = useCollapsibleRoot({
    open: () => local.open,
    defaultOpen: () => local.defaultOpen,
    onOpenChange,
    disabled: () => local.disabled,
  });

  const state: CollapsibleRoot.State = {
    open: collapsible.open,
    disabled: collapsible.disabled,
    transitionStatus: collapsible.transitionStatus,
  };

  const contextValue: CollapsibleRootContext = {
    ...collapsible,
    onOpenChange,
    state,
  };

  return (
    <CollapsibleRootContext.Provider value={contextValue}>
      <Show when={merged.render !== null} fallback={elementProps.children}>
        <RenderElement
          element="div"
          componentProps={merged as any}
          params={{
            state,
            ref: useForkRefN(merged.ref, local.ref),
            props: elementProps as any,
            customStyleHookMapping: collapsibleStyleHookMapping,
          }}
        />
      </Show>
    </CollapsibleRootContext.Provider>
  );
}

export namespace CollapsibleRoot {
  export interface State
    extends Pick<useCollapsibleRoot.ReturnValue, 'open' | 'disabled' | 'transitionStatus'> {}

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'render'> {
    /**
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open?: boolean;

    /**
     * Whether the collapsible panel is initially open.
     *
     * To render a controlled collapsible, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the panel is opened or closed.
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    render?: BaseUIComponentProps<'div', State>['render'] | null;
  }
}
