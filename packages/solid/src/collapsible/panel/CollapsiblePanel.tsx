'use client';
import { createEffect, createMemo, onCleanup, Show } from 'solid-js';
import { access, type MaybeAccessor, splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElementV2';
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
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'hiddenUntilFound',
    'keepMounted',
    'id',
  ]);
  const hiddenUntilFound = () => access(local.hiddenUntilFound) ?? false;
  const keepMounted = () => access(local.keepMounted) ?? false;

  if (process.env.NODE_ENV !== 'production') {
    createEffect(() => {
      if (hiddenUntilFound() && keepMounted() === false) {
        warn(
          'The `keepMounted={false}` prop on a Collapsible will be ignored when using `hiddenUntilFound` since it requires the Panel to remain mounted even when closed.',
        );
      }
    });
  }

  const context = useCollapsibleRootContext();

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
    animationType: context.animationType,
    setAnimationType: context.setAnimationType,
    height: context.height,
    hiddenUntilFound,
    id: context.panelId,
    keepMounted,
    mounted: context.mounted,
    onOpenChange: context.onOpenChange,
    open: context.open,
    refs: context.refs,
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
    ref: () => context.refs.panelRef,
    onComplete() {
      if (!context.open()) {
        return;
      }

      context.setDimensions({ height: undefined, width: undefined });
    },
  });

  const shouldRender = createMemo(
    () => keepMounted() || hiddenUntilFound() || (!keepMounted() && context.mounted()),
  );

  const element = useRenderElement('div', componentProps, {
    state: context.state,
    ref: (el) => {
      context.refs.panelRef = el;
      panel.ref(el);
    },
    props: [
      panel.props,
      () => ({
        style: {
          [CollapsiblePanelCssVars.collapsiblePanelHeight as string]:
            context.height() === undefined ? 'auto' : `${context.height()}px`,
          [CollapsiblePanelCssVars.collapsiblePanelWidth as string]:
            context.width() === undefined ? 'auto' : `${context.width()}px`,
        },
      }),
      elementProps,
    ],
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  return (
    <Show when={shouldRender()}>
      {element()}
    </Show>
  );
}

export namespace CollapsiblePanel {
  export interface State extends CollapsibleRoot.State {}

  export interface Props extends BaseUIComponentProps<'div', CollapsibleRoot.State> {
    /**
     * Allows the browser’s built-in page search to find and expand the panel contents.
     *
     * Overrides the `keepMounted` prop and uses `hidden="until-found"`
     * to hide the element without removing it from the DOM.
     *
     * @default false
     */
    hiddenUntilFound?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether to keep the element in the DOM while the panel is hidden.
     * This prop is ignored when `hiddenUntilFound` is used.
     * @default false
     */
    keepMounted?: MaybeAccessor<boolean | undefined>;
  }
}
