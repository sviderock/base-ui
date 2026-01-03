import { createEffect, createMemo, Show } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
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
  const hiddenUntilFound = () => local.hiddenUntilFound ?? false;
  const keepMounted = () => local.keepMounted ?? false;

  if (process.env.NODE_ENV !== 'production') {
    createEffect(() => {
      if (hiddenUntilFound() && keepMounted() === false) {
        warn(
          'The `keepMounted={false}` prop on a Collapsible will be ignored when using `hiddenUntilFound` since it requires the Panel to remain mounted even when closed.',
        );
      }
    });
  }

  const {
    animationType,
    setAnimationType,
    height,
    setHiddenUntilFound,
    setKeepMounted,
    panelId,
    mounted,
    onOpenChange,
    open,
    refs,
    runOnceAnimationsFinish,
    setDimensions,
    setMounted,
    setOpen,
    setVisible,
    transitionDimension,
    setTransitionDimension,
    visible,
    width,
    state,
  } = useCollapsibleRootContext();

  createEffect(() => {
    setHiddenUntilFound(hiddenUntilFound());
  });

  createEffect(() => {
    setKeepMounted(keepMounted());
  });

  const panel = useCollapsiblePanel({
    animationType,
    setAnimationType,
    height,
    hiddenUntilFound,
    id: () => local.id ?? panelId(),
    keepMounted,
    mounted,
    onOpenChange,
    open,
    refs,
    runOnceAnimationsFinish,
    setDimensions,
    setMounted,
    setOpen,
    setVisible,
    transitionDimension,
    setTransitionDimension,
    visible,
    width,
  });

  useOpenChangeComplete({
    open,
    ref: () => refs.panelRef,
    onComplete() {
      if (!open()) {
        return;
      }

      setDimensions({ height: undefined, width: undefined });
    },
  });

  const shouldRender = createMemo(
    () => keepMounted() || hiddenUntilFound() || (!keepMounted() && mounted()),
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      refs.panelRef = el;
      panel.ref(el);
    },
    props: [
      panel.props,
      {
        get style() {
          return {
            [CollapsiblePanelCssVars.collapsiblePanelHeight as string]:
              height() === undefined ? 'auto' : `${height()}px`,
            [CollapsiblePanelCssVars.collapsiblePanelWidth as string]:
              width() === undefined ? 'auto' : `${width()}px`,
          };
        },
      },
      elementProps,
    ],
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  return <Show when={shouldRender()}>{element()}</Show>;
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
    hiddenUntilFound?: boolean;
    /**
     * Whether to keep the element in the DOM while the panel is hidden.
     * This prop is ignored when `hiddenUntilFound` is used.
     * @default false
     */
    keepMounted?: boolean;
  }
}
