'use client';
import { onMount, splitProps } from 'solid-js';
import { useDirection } from '../../direction-provider/DirectionContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { Dimensions, ModifierKey } from '../composite';
import { CompositeList, type CompositeMetadata } from '../list/CompositeList';
import { CompositeRootContext } from './CompositeRootContext';
import { useCompositeRoot } from './useCompositeRoot';

const COMPOSITE_ROOT_STATE = {};

/**
 * @internal
 */
export function CompositeRoot<Metadata extends {}>(componentProps: CompositeRoot.Props<Metadata>) {
  const [local, elementProps] = splitProps(componentProps, [
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
    'disabledIndices',
    'modifierKeys',
    'highlightItemOnHover',
  ]);

  const direction = useDirection();
  const compositeRoot = useCompositeRoot(local, direction);

  function onMapChange(newMap: Map<Element, CompositeMetadata<Metadata> | null>) {
    local.onMapChange?.(newMap);
    compositeRoot.onMapChange(newMap);
  }

  const contextValue: CompositeRootContext = {
    highlightedIndex: compositeRoot.highlightedIndex,
    onHighlightedIndexChange: compositeRoot.onHighlightedIndexChange,
    highlightItemOnHover: () => local.highlightItemOnHover ?? false,
  };

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList<Metadata>
        elements={compositeRoot.elements}
        // @ts-expect-error - TODO: fix typing
        setElements={compositeRoot.setElements}
        onMapChange={onMapChange}
      >
        <RenderElement
          element="div"
          ref={compositeRoot.setRootRef}
          componentProps={componentProps}
          params={{
            state: COMPOSITE_ROOT_STATE,
            // TODO: fix typing
            props: [compositeRoot.props(), elementProps as any],
          }}
        />
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
    rootRef?: HTMLElement | undefined;
    disabledIndices?: number[];
    modifierKeys?: ModifierKey[];
    highlightItemOnHover?: boolean;
  }
}
