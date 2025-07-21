'use client';
import { type Accessor, createEffect, onCleanup, Show, splitProps } from 'solid-js';
import { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { RenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { warn } from '../../utils/warn';
import type { CollapsibleRoot } from '../root/CollapsibleRoot';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import { collapsibleStyleHookMapping } from '../root/styleHooks';
import { CollapsiblePanelCssVars } from './CollapsiblePanelCssVars';
import { useCollapsiblePanel } from './useCollapsiblePanel';

/**
 * A panel with the collapsible contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
export function CollapsiblePanel(componentProps: CollapsiblePanel.Props) {
  const [local, elementProps] = splitProps(componentProps, [
    'class',
    'hiddenUntilFound',
    'keepMounted',
    'render',
    'id',
    'ref',
  ]);

  if (process.env.NODE_ENV !== 'production') {
    createEffect(() => {
      if (local.hiddenUntilFound && local.keepMounted === false) {
        warn(
          'The `keepMounted={false}` prop on a Collapsible will be ignored when using `hiddenUntilFound` since it requires the Panel to remain mounted even when closed.',
        );
      }
    });
  }

  const context = useCollapsibleRootContext();

  const hiddenUntilFound = () => local.hiddenUntilFound ?? false;
  const keepMounted = () => local.keepMounted ?? false;

  createEffect(() => {
    if (local.id) {
      context.setPanelIdState(local.id);

      onCleanup(() => {
        context.setPanelIdState(undefined);
      });
    }
  });

  createEffect(() => {
    context.setHiddenUntilFound(hiddenUntilFound());
  });

  createEffect(() => {
    context.setKeepMounted(keepMounted());
  });

  const panel = useCollapsiblePanel({
    abortControllerRef: context.abortControllerRef,
    animationType: context.animationType,
    setAnimationType: context.setAnimationType,
    height: context.height,
    hiddenUntilFound,
    id: context.panelId,
    keepMounted,
    mounted: context.mounted,
    onOpenChange: context.onOpenChange,
    open: context.open,
    panelRef: context.panelRef,
    runOnceAnimationsFinish: context.runOnceAnimationsFinish,
    setDimensions: context.setDimensions,
    setMounted: context.setMounted,
    setOpen: context.setOpen,
    setVisible: context.setVisible,
    transitionDimension: context.transitionDimension,
    setTransitionDimension: context.setTransitionDimension,
    visible: context.visible,
    width: context.width,
  });

  useOpenChangeComplete({
    open: context.open,
    ref: context.panelRef,
    onComplete() {
      if (!context.open()) {
        return;
      }

      context.setDimensions({ height: undefined, width: undefined });
    },
  });

  const panelState: CollapsiblePanel.State = {
    ...context.state,
    transitionStatus: context.transitionStatus,
  };

  const shouldRender = () =>
    keepMounted() || hiddenUntilFound() || (!keepMounted() && context.mounted());

  return (
    <Show when={shouldRender()} fallback={null}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={useForkRef(componentProps.ref as HTMLDivElement, context.panelRef, panel.ref)}
        params={{
          state: () => panelState,
          props: () => [
            panel.props(),
            {
              style: {
                [CollapsiblePanelCssVars.collapsiblePanelHeight as string]:
                  context.height() === undefined ? 'auto' : `${context.height()}px`,
                [CollapsiblePanelCssVars.collapsiblePanelWidth as string]:
                  context.width() === undefined ? 'auto' : `${context.width()}px`,
              },
            },
            elementProps as any,
          ],
          customStyleHookMapping: collapsibleStyleHookMapping,
        }}
      />
    </Show>
  );
}

export namespace CollapsiblePanel {
  export interface State extends CollapsibleRoot.State {
    transitionStatus: Accessor<TransitionStatus>;
  }

  export interface Props extends BaseUIComponentProps<'div', CollapsibleRoot.State> {
    /**
     * Allows the browser’s built-in page search to find and expand the panel contents.
     *
     * Overrides the `keepMounted` prop and uses `hidden="until-found"`
     * to hide the element without removing it from the DOM.
     *
     * @default false
     */
    hiddenUntilFound?: boolean;
    /**
     * Whether to keep the element in the DOM while the panel is hidden.
     * This prop is ignored when `hiddenUntilFound` is used.
     * @default false
     */
    keepMounted?: boolean;
  }
}
