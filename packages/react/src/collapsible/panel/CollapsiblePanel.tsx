'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
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
export const CollapsiblePanel = React.forwardRef(function CollapsiblePanel(
  componentProps: CollapsiblePanel.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    hiddenUntilFound: hiddenUntilFoundProp,
    keepMounted: keepMountedProp,
    render,
    id: idProp,
    ...elementProps
  } = componentProps;

  if (process.env.NODE_ENV !== 'production') {
    useModernLayoutEffect(() => {
      if (hiddenUntilFoundProp && keepMountedProp === false) {
        warn(
          'The `keepMounted={false}` prop on a Collapsible will be ignored when using `hiddenUntilFound` since it requires the Panel to remain mounted even when closed.',
        );
      }
    }, [hiddenUntilFoundProp, keepMountedProp]);
  }

  const {
    abortControllerRef,
    animationTypeRef,
    height,
    mounted,
    onOpenChange,
    open,
    panelId,
    panelRef,
    runOnceAnimationsFinish,
    setDimensions,
    setHiddenUntilFound,
    setKeepMounted,
    setMounted,
    setPanelIdState,
    setOpen,
    setVisible,
    state,
    transitionDimensionRef,
    visible,
    width,
    transitionStatus,
  } = useCollapsibleRootContext();

  const hiddenUntilFound = hiddenUntilFoundProp ?? false;
  const keepMounted = keepMountedProp ?? false;

  useModernLayoutEffect(() => {
    if (idProp) {
      setPanelIdState(idProp);
      return () => {
        setPanelIdState(undefined);
      };
    }
    return undefined;
  }, [idProp, setPanelIdState]);

  useModernLayoutEffect(() => {
    setHiddenUntilFound(hiddenUntilFound);
  }, [setHiddenUntilFound, hiddenUntilFound]);

  useModernLayoutEffect(() => {
    setKeepMounted(keepMounted);
  }, [setKeepMounted, keepMounted]);

  const { props } = useCollapsiblePanel({
    abortControllerRef,
    animationTypeRef,
    externalRef: forwardedRef,
    height,
    hiddenUntilFound,
    id: panelId,
    keepMounted,
    mounted,
    onOpenChange,
    open,
    panelRef,
    runOnceAnimationsFinish,
    setDimensions,
    setMounted,
    setOpen,
    setVisible,
    transitionDimensionRef,
    visible,
    width,
  });

  useOpenChangeComplete({
    open,
    ref: panelRef,
    onComplete() {
      if (!open) {
        return;
      }

      setDimensions({ height: undefined, width: undefined });
    },
  });

  const panelState: CollapsiblePanel.State = React.useMemo(
    () => ({
      ...state,
      transitionStatus,
    }),
    [state, transitionStatus],
  );

  const element = useRenderElement('div', componentProps, {
    state: panelState,
    ref: [forwardedRef, panelRef],
    props: [
      props,
      {
        style: {
          [CollapsiblePanelCssVars.collapsiblePanelHeight as string]:
            height === undefined ? 'auto' : `${height}px`,
          [CollapsiblePanelCssVars.collapsiblePanelWidth as string]:
            width === undefined ? 'auto' : `${width}px`,
        },
      },
      elementProps,
    ],
    customStyleHookMapping: collapsibleStyleHookMapping,
  });

  const shouldRender = keepMounted || hiddenUntilFound || (!keepMounted && mounted);

  if (!shouldRender) {
    return null;
  }

  return element;
});

export namespace CollapsiblePanel {
  export interface State extends CollapsibleRoot.State {
    transitionStatus: TransitionStatus;
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
