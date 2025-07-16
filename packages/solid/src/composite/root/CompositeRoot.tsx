'use client';
import { mergeProps, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useDirection } from '../../direction-provider/DirectionContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useEventCallback } from '../../utils/useEventCallback';
import { useRenderElement } from '../../utils/useRenderElement';
import type { Dimensions, ModifierKey } from '../composite';
import { CompositeList, type CompositeMetadata } from '../list/CompositeList';
import { CompositeRootContext } from './CompositeRootContext';
import { useCompositeRoot } from './useCompositeRoot';

const COMPOSITE_ROOT_STATE = {};

/**
 * @internal
 */
export function CompositeRoot<Metadata extends {}>(componentProps: CompositeRoot.Props<Metadata>) {
  const merged = mergeProps(
    { highlightItemOnHover: false } satisfies CompositeRoot.Props<Metadata>,
    componentProps,
  );
  const [local, elementProps] = splitProps(merged, [
    'render',
    'class',
    'highlightedIndex',
    'onHighlightedIndexChange',
    'orientation',
    'dense',
    'itemSizes',
    'loop',
    'cols',
    'enableHomeAndEndKeys',
    'onMapChange',
    'stopEventPropagation',
    'rootRef',
    'disabledIndices',
    'modifierKeys',
    'highlightItemOnHover',
  ]);

  const direction = useDirection();

  const {
    props,
    highlightedIndex,
    onHighlightedIndexChange,
    elementsRef,
    onMapChange: onMapChangeUnwrapped,
  } = useCompositeRoot({
    itemSizes: () => local.itemSizes,
    cols: () => local.cols,
    loop: () => local.loop,
    dense: () => local.dense,
    orientation: () => local.orientation,
    highlightedIndex: () => local.highlightedIndex,
    onHighlightedIndexChange: (index) => local.onHighlightedIndexChange?.(index),
    rootRef: () => local.rootRef,
    stopEventPropagation: () => local.stopEventPropagation,
    enableHomeAndEndKeys: () => local.enableHomeAndEndKeys,
    direction,
    disabledIndices: () => local.disabledIndices,
    modifierKeys: () => local.modifierKeys,
  });

  const onMapChange = useEventCallback(
    (newMap: Map<Element, CompositeMetadata<Metadata> | null>) => {
      local.onMapChange?.(newMap);
      onMapChangeUnwrapped(newMap);
    },
  );

  const element = useRenderElement('div', componentProps, {
    state: COMPOSITE_ROOT_STATE,
    props: [props(), elementProps],
  });

  const contextValue: CompositeRootContext = {
    highlightedIndex,
    onHighlightedIndexChange,
    highlightItemOnHover: () => local.highlightItemOnHover,
  };

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList<Metadata> elementsRef={elementsRef} onMapChange={onMapChange}>
        <Dynamic component={element()} />
      </CompositeList>
    </CompositeRootContext.Provider>
  );
}

export namespace CompositeRoot {
  export interface State {}

  export interface Props<Metadata> extends BaseUIComponentProps<'div', State> {
    orientation?: 'horizontal' | 'vertical' | 'both';
    cols?: number;
    loop?: boolean;
    highlightedIndex?: number;
    onHighlightedIndexChange?: (index: number) => void;
    itemSizes?: Dimensions[];
    dense?: boolean;
    enableHomeAndEndKeys?: boolean;
    onMapChange?: (newMap: Map<Node, CompositeMetadata<Metadata> | null>) => void;
    stopEventPropagation?: boolean;
    rootRef?: HTMLElement | null;
    disabledIndices?: number[];
    modifierKeys?: ModifierKey[];
    highlightItemOnHover?: boolean;
  }
}
