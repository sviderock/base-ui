'use client';
import { createEffect, onCleanup, Show, splitProps } from 'solid-js';
import { useCollapsiblePanel } from '../../collapsible/panel/useCollapsiblePanel';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { type MaybeAccessor, access, handleRef } from '../../solid-helpers';
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
  const [local, elementProps] = splitProps(componentProps, [
    'class',
    'hiddenUntilFound',
    'keepMounted',
    'render',
    'id',
    'children',
  ]);

  const { hiddenUntilFound: contextHiddenUntilFound, keepMounted: contextKeepMounted } =
    useAccordionRootContext();

  const {
    abortControllerRef,
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

  const hiddenUntilFound = () => access(local.hiddenUntilFound) ?? contextHiddenUntilFound();
  const keepMounted = () => access(local.keepMounted) ?? contextKeepMounted();

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
    ref: refs.panelRef,
    onComplete() {
      if (!open()) {
        return;
      }

      setDimensions({ width: undefined, height: undefined });
    },
  });

  const { props } = useCollapsiblePanel({
    abortControllerRef,
    animationType,
    setAnimationType,
    height,
    hiddenUntilFound,
    id: () => local.id ?? panelId(),
    keepMounted,
    mounted,
    onOpenChange,
    open,
    panelRef: refs.panelRef,
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

  const panelState: AccordionPanel.State = {
    ...state(),
    transitionStatus: transitionStatus(),
  };

  const shouldRender = () => keepMounted() || hiddenUntilFound() || (!keepMounted() && mounted());
  return (
    <Show when={shouldRender()} fallback={null}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={(el) => {
          handleRef(componentProps.ref, el);
          refs.panelRef = el;
        }}
        params={{
          state: panelState,
          customStyleHookMapping: accordionStyleHookMapping,
          props: [
            props,
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
    transitionStatus: MaybeAccessor<TransitionStatus>;
  }

  export interface Props
    extends BaseUIComponentProps<'div', AccordionItem.State>,
      Pick<AccordionRoot.Props, 'hiddenUntilFound' | 'keepMounted'> {}
}
