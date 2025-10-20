'use client';
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  type ComponentProps,
  type JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';
import { CompositeList } from '../../composite/list/CompositeList';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useScrollLock } from '../../utils';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { inertValue } from '../../utils/inertValue';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { RenderElement } from '../../utils/useRenderElement';
import { clearPositionerStyles } from '../popup/utils';
import { useSelectFloatingContext, useSelectRootContext } from '../root/SelectRootContext';
import { SelectPositionerContext } from './SelectPositionerContext';

const FIXED: JSX.CSSProperties = { position: 'fixed' };

/**
 * Positions the select menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectPositioner(componentProps: SelectPositioner.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'anchor',
    'positionMethod',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'collisionBoundary',
    'collisionPadding',
    'arrowPadding',
    'sticky',
    'trackAnchor',
    'alignItemWithTrigger',
    'collisionAvoidance',
  ]);
  const anchor = () => access(local.anchor);
  const positionMethod = () => access(local.positionMethod) ?? 'absolute';
  const side = () => access(local.side) ?? 'bottom';
  const align = () => access(local.align) ?? 'center';
  const sideOffset = () => access(local.sideOffset) ?? 0;
  const alignOffset = () => access(local.alignOffset) ?? 0;
  const collisionBoundary = () => access(local.collisionBoundary) ?? 'clipping-ancestors';
  const collisionPadding = () => access(local.collisionPadding);
  const arrowPadding = () => access(local.arrowPadding) ?? 5;
  const sticky = () => access(local.sticky) ?? false;
  const trackAnchor = () => access(local.trackAnchor) ?? true;
  const alignItemWithTrigger = () => access(local.alignItemWithTrigger) ?? true;
  const collisionAvoidance = () => access(local.collisionAvoidance) ?? DROPDOWN_COLLISION_AVOIDANCE;

  const { store, setStore, refs } = useSelectRootContext();
  const floatingRootContext = useSelectFloatingContext();

  const [controlledAlignItemWithTrigger, setControlledAlignItemWithTrigger] =
    createSignal(alignItemWithTrigger());
  const alignItemWithTriggerActive = () =>
    store.mounted && controlledAlignItemWithTrigger() && !store.touchModality;

  createEffect(() => {
    if (!store.mounted && controlledAlignItemWithTrigger() !== alignItemWithTrigger()) {
      setControlledAlignItemWithTrigger(alignItemWithTrigger());
    }
  });

  createEffect(() => {
    if (!alignItemWithTrigger() || !store.mounted) {
      if (store.scrollUpArrowVisible) {
        setStore('scrollUpArrowVisible', false);
      }
      if (store.scrollDownArrowVisible) {
        setStore('scrollDownArrowVisible', false);
      }
    }
  });

  createEffect(() => {
    refs.alignItemWithTriggerActiveRef = alignItemWithTriggerActive();
  });

  useScrollLock({
    enabled: () => (alignItemWithTriggerActive() || store.modal) && store.open,
    mounted: () => store.mounted,
    open: () => store.open,
    referenceElement: () => store.triggerElement,
  });

  const positioning = useAnchorPositioning({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted: () => store.mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    trackAnchor: () => trackAnchor() ?? !alignItemWithTriggerActive(),
    collisionAvoidance,
    keepMounted: true,
  });

  const renderedSide = () => (alignItemWithTriggerActive() ? 'none' : positioning.side());
  const positionerStyles = () =>
    alignItemWithTriggerActive() ? FIXED : positioning.positionerStyles();

  const defaultProps = createMemo<ComponentProps<'div'>>(() => {
    const hiddenStyles: JSX.CSSProperties = {};

    if (!store.open) {
      hiddenStyles['pointer-events'] = 'none';
    }

    return {
      role: 'presentation',
      hidden: !store.mounted,
      style: {
        ...positionerStyles(),
        ...hiddenStyles,
      },
    };
  });

  const state = createMemo<SelectPositioner.State>(() => ({
    open: store.open,
    side: renderedSide(),
    align: positioning.align(),
    anchorHidden: positioning.anchorHidden(),
  }));

  const setPositionerElement = (element: HTMLElement | null | undefined) => {
    setStore('positionerElement', element);
  };

  const onMapChange = () => {
    if (store.value !== null) {
      const valueIndex = refs.valuesRef.indexOf(store.value);
      if (valueIndex === -1) {
        setStore(
          produce((state) => {
            state.label = '';
            state.selectedIndex = null;
          }),
        );
      }
    }

    if (store.open && alignItemWithTriggerActive()) {
      setStore(
        produce((state) => {
          state.scrollUpArrowVisible = false;
          state.scrollDownArrowVisible = false;
        }),
      );

      if (store.positionerElement) {
        clearPositionerStyles(store.positionerElement, { height: '' });
      }
    }
  };

  const contextValue: SelectPositionerContext = {
    ...positioning,
    side: renderedSide,
    alignItemWithTriggerActive,
    setControlledAlignItemWithTrigger,
  };

  return (
    <CompositeList
      refs={{ elements: refs.listRef, labels: refs.labelsRef }}
      onMapChange={onMapChange}
    >
      <SelectPositionerContext.Provider value={contextValue}>
        {store.mounted && store.modal && (
          <InternalBackdrop managed inert={inertValue(!store.open)} cutout={store.triggerElement} />
        )}
        <RenderElement
          element="div"
          componentProps={componentProps}
          ref={(el) => {
            setPositionerElement(el);
            if (typeof componentProps.ref === 'function') {
              componentProps.ref(el);
            } else {
              componentProps.ref = el;
            }
          }}
          params={{
            state: state(),
            customStyleHookMapping: popupStateMapping,
            props: [defaultProps(), elementProps],
          }}
        />
      </SelectPositionerContext.Provider>
    </CompositeList>
  );
}

export namespace SelectPositioner {
  export interface State {
    open: boolean;
    side: Side | 'none';
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends useAnchorPositioning.SharedParameters,
      BaseUIComponentProps<'div', State> {
    /**
     * Whether the positioner overlaps the trigger so the selected item's text is aligned with the trigger's value text. This only applies to mouse input and is automatically disabled if there is not enough space.
     * @default true
     */
    alignItemWithTrigger?: MaybeAccessor<boolean | undefined>;
  }
}
