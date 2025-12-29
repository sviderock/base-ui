'use client';
import { createEffect, createSignal, mergeProps, type JSX } from 'solid-js';
import { produce } from 'solid-js/store';
import { CompositeList } from '../../composite/list/CompositeList';
import type { Padding, VirtualElement } from '../../floating-ui-solid';
import { splitComponentProps } from '../../solid-helpers';
import { useScrollLock } from '../../utils';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { DROPDOWN_COLLISION_AVOIDANCE } from '../../utils/constants';
import { inertValue } from '../../utils/inertValue';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import {
  useAnchorPositioning,
  type Align,
  type Boundary,
  type CollisionAvoidance,
  type OffsetFunction,
  type Side,
} from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElementV2';
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
  const positionMethod = () => local.positionMethod ?? 'absolute';
  const side = () => local.side ?? 'bottom';
  const align = () => local.align ?? 'center';
  const sideOffset = () => local.sideOffset ?? 0;
  const alignOffset = () => local.alignOffset ?? 0;
  const collisionBoundary = () => local.collisionBoundary ?? 'clipping-ancestors';
  const collisionPadding = () => local.collisionPadding;
  const arrowPadding = () => local.arrowPadding ?? 5;
  const sticky = () => local.sticky ?? false;
  const trackAnchor = () => local.trackAnchor ?? true;
  const alignItemWithTrigger = () => local.alignItemWithTrigger ?? true;
  const collisionAvoidance = () => local.collisionAvoidance ?? DROPDOWN_COLLISION_AVOIDANCE;

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
    anchor: () => local.anchor,
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

  const defaultProps: JSX.HTMLAttributes<HTMLDivElement> = {
    role: 'presentation',
    get hidden() {
      return !store.mounted;
    },
    get style() {
      const hiddenStyles: JSX.CSSProperties = {};

      if (!store.open) {
        hiddenStyles['pointer-events'] = 'none';
      }

      return {
        ...positionerStyles(),
        ...hiddenStyles,
      };
    },
  };

  const state: SelectPositioner.State = {
    get open() {
      return store.open;
    },
    get side() {
      return renderedSide();
    },
    get align() {
      return positioning.align();
    },
    get anchorHidden() {
      return positioning.anchorHidden();
    },
  };

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

  const contextValue: SelectPositionerContext = mergeProps(positioning, {
    side: renderedSide,
    alignItemWithTriggerActive,
    setControlledAlignItemWithTrigger,
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setPositionerElement,
    customStyleHookMapping: popupStateMapping,
    props: [defaultProps, elementProps],
  });

  return (
    <CompositeList
      refs={{ elements: refs.listRef, labels: refs.labelsRef }}
      onMapChange={onMapChange}
    >
      <SelectPositionerContext.Provider value={contextValue}>
        {store.mounted && store.modal && (
          <InternalBackdrop managed inert={inertValue(!store.open)} cutout={store.triggerElement} />
        )}
        {element()}
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

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the positioner overlaps the trigger so the selected item's text is aligned with the trigger's value text. This only applies to mouse input and is automatically disabled if there is not enough space.
     * @default true
     */
    alignItemWithTrigger?: boolean;

    /**
     * An element to position the popup against.
     * By default, the popup will be positioned against the trigger.
     */
    anchor?: Element | null | VirtualElement | (() => Element | VirtualElement | null) | undefined;
    /**
     * Determines which CSS `position` property to use.
     * @default 'absolute'
     */
    positionMethod?: 'absolute' | 'fixed';
    /**
     * Which side of the anchor element to align the popup against.
     * May automatically change to avoid collisions.
     * @default 'bottom'
     */
    side?: Side;
    /**
     * Distance between the anchor and the popup in pixels.
     * Also accepts a function that returns the distance to read the dimensions of the anchor
     * and positioner elements, along with its side and alignment.
     *
     * - `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
     * - `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
     * - `data.side`: which side of the anchor element the positioner is aligned against.
     * - `data.align`: how the positioner is aligned relative to the specified side.
     * @default 0
     */
    sideOffset?: number | OffsetFunction;
    /**
     * How to align the popup relative to the specified side.
     * @default 'center'
     */
    align?: 'start' | 'end' | 'center';
    /**
     * Additional offset along the alignment axis in pixels.
     * Also accepts a function that returns the offset to read the dimensions of the anchor
     * and positioner elements, along with its side and alignment.
     *
     * - `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
     * - `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
     * - `data.side`: which side of the anchor element the positioner is aligned against.
     * - `data.align`: how the positioner is aligned relative to the specified side.
     * @default 0
     */
    alignOffset?: number | OffsetFunction;
    /**
     * An element or a rectangle that delimits the area that the popup is confined to.
     * @default 'clipping-ancestors'
     */
    collisionBoundary?: Boundary;
    /**
     * Additional space to maintain from the edge of the collision boundary.
     * @default 5
     */
    collisionPadding?: Padding;
    /**
     * Whether to maintain the popup in the viewport after
     * the anchor element was scrolled out of view.
     * @default false
     */
    sticky?: boolean;
    /**
     * Minimum distance to maintain between the arrow and the edges of the popup.
     *
     * Use it to prevent the arrow element from hanging out of the rounded corners of a popup.
     * @default 5
     */
    arrowPadding?: number;
    /**
     * Whether the popup tracks any layout shift of its positioning anchor.
     * @default true
     */
    trackAnchor?: boolean;
    /**
     * Determines how to handle collisions when positioning the popup.
     */
    collisionAvoidance?: CollisionAvoidance;
  }
}
