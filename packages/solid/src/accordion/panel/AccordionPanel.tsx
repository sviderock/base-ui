'use client';
import { createEffect, createMemo, onCleanup, Show } from 'solid-js';
import { useCollapsiblePanel } from '../../collapsible/panel/useCollapsiblePanel';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { access, splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { RenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { warn } from '../../utils/warn';
import type { AccordionItem } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { accordionStyleHookMapping } from '../item/styleHooks';
import type { AccordionRoot } from '../root/AccordionRoot';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import { AccordionPanelCssVars } from './AccordionPanelCssVars';

/**
 * A collapsible panel with the accordion item contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export function AccordionPanel(componentProps: AccordionPanel.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'hiddenUntilFound',
    'keepMounted',
    'id',
  ]);

  const { hiddenUntilFound: contextHiddenUntilFound, keepMounted: contextKeepMounted } =
    useAccordionRootContext();

  const hiddenUntilFound = () => access(local.hiddenUntilFound) ?? contextHiddenUntilFound();
  const keepMounted = () => access(local.keepMounted) ?? contextKeepMounted();

  const {
    animationType,
    setAnimationType,
    height,
    mounted,
    onOpenChange,
    open,
    panelId,
    refs,
    runOnceAnimationsFinish,
    setDimensions,
    setHiddenUntilFound,
    setKeepMounted,
    setMounted,
    setOpen,
    setVisible,
    transitionDimension,
    setTransitionDimension,
    visible,
    width,
    setPanelIdState,
    transitionStatus,
  } = useCollapsibleRootContext();

  if (process.env.NODE_ENV !== 'production') {
    createEffect(() => {
      if (keepMounted() === false && hiddenUntilFound()) {
        warn(
          'The `keepMounted={false}` prop on a Accordion.Panel will be ignored when using `contextHiddenUntilFound` on the Panel or the Root since it requires the panel to remain mounted when closed.',
        );
      }
    });
  }

  createEffect(() => {
    if (local.id) {
      setPanelIdState(local.id);
      onCleanup(() => {
        setPanelIdState(undefined);
      });
    }
  });

  createEffect(() => {
    setHiddenUntilFound(hiddenUntilFound());
  });

  createEffect(() => {
    setKeepMounted(keepMounted());
  });

  useOpenChangeComplete({
    open,
    ref: () => refs.panelRef,
    onComplete() {
      if (!open()) {
        return;
      }

      setDimensions({ width: undefined, height: undefined });
    },
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

  const { state, triggerId } = useAccordionItemContext();

  const panelState = createMemo<AccordionPanel.State>(() => ({
    ...state(),
    transitionStatus: transitionStatus(),
  }));

  const shouldRender = () => keepMounted() || hiddenUntilFound() || (!keepMounted() && mounted());
  return (
    <Show when={shouldRender()}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={(el) => {
          if (typeof componentProps.ref === 'function') {
            componentProps.ref(el);
          } else {
            componentProps.ref = el;
          }
          refs.panelRef = el;
          panel.ref(el);
        }}
        params={{
          state: panelState(),
          customStyleHookMapping: accordionStyleHookMapping,
          props: [
            panel.props(),
            {
              'aria-labelledby': triggerId?.(),
              role: 'region',
              style: {
                [AccordionPanelCssVars.accordionPanelHeight as string]:
                  height() === undefined ? 'auto' : `${height()}px`,
                [AccordionPanelCssVars.accordionPanelWidth as string]:
                  width() === undefined ? 'auto' : `${width()}px`,
              },
            },
            elementProps,
          ],
        }}
      />
    </Show>
  );
}

export namespace AccordionPanel {
  export interface State extends AccordionItem.State {
    transitionStatus: TransitionStatus;
  }

  export interface Props
    extends BaseUIComponentProps<'div', AccordionItem.State>,
      Pick<AccordionRoot.Props, 'hiddenUntilFound' | 'keepMounted'> {}
}
