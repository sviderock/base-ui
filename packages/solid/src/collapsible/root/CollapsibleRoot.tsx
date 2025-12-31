import { Show, mergeProps as solidMergeProps } from 'solid-js';
import { type MaybeAccessor, access, splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
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
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'defaultOpen',
    'disabled',
    'onOpenChange',
    'open',
  ]);
  const open = () => access(local.open);
  const defaultOpen = () => access(local.defaultOpen) ?? false;
  const disabled = () => access(local.disabled) ?? false;

  const onOpenChange = (newOpen: boolean) => {
    local.onOpenChange?.(newOpen);
  };

  const collapsible = useCollapsibleRoot({
    open,
    defaultOpen,
    onOpenChange,
    disabled,
  });

  const state: CollapsibleRoot.State = {
    get open() {
      return collapsible.open();
    },
    get disabled() {
      return collapsible.disabled();
    },
    get transitionStatus() {
      return collapsible.transitionStatus();
    },
  };

  const contextValue: CollapsibleRootContext = solidMergeProps(collapsible, {
    onOpenChange,
    state,
  });

  const element = useRenderElement('div', componentProps, {
    state,
    props: elementProps,
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  return (
    <CollapsibleRootContext.Provider value={contextValue}>
      <Show when={componentProps.render !== null} fallback={componentProps.children}>
        {element()}
      </Show>
    </CollapsibleRootContext.Provider>
  );
}

export namespace CollapsibleRoot {
  export interface State {
    open: boolean;
    disabled: boolean;
    transitionStatus: TransitionStatus;
    hidden?: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open?: MaybeAccessor<boolean | undefined>;

    /**
     * Whether the collapsible panel is initially open.
     *
     * To render a controlled collapsible, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: MaybeAccessor<boolean | undefined>;
    /**
     * Event handler called when the panel is opened or closed.
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
  }
}
