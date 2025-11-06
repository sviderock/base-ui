'use client';
import { useDirection } from '../../direction-provider/DirectionContext';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
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
  const [, local, elementProps] = splitComponentProps(componentProps, [
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
    highlightItemOnHover: () => access(local.highlightItemOnHover) ?? false,
  };

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList<Metadata> refs={compositeRoot.refs} onMapChange={onMapChange}>
        <RenderElement
          element="div"
          ref={(el) => {
            compositeRoot.setRootRef(el);
          }}
          componentProps={componentProps}
          params={{
            state: COMPOSITE_ROOT_STATE,
            props: [compositeRoot.props(), elementProps],
          }}
        />
      </CompositeList>
    </CompositeRootContext.Provider>
  );
}

export namespace CompositeRoot {
  export interface State {}

  export interface Props<Metadata> extends BaseUIComponentProps<'div', State> {
    orientation?: MaybeAccessor<'horizontal' | 'vertical' | 'both' | undefined>;
    cols?: MaybeAccessor<number | undefined>;
    loop?: MaybeAccessor<boolean | undefined>;
    highlightedIndex?: MaybeAccessor<number | undefined>;
    onHighlightedIndexChange?: (index: number) => void;
    itemSizes?: MaybeAccessor<Dimensions[] | undefined>;
    dense?: MaybeAccessor<boolean | undefined>;
    enableHomeAndEndKeys?: MaybeAccessor<boolean | undefined>;
    onMapChange?: (newMap: Map<Node, CompositeMetadata<Metadata> | null>) => void;
    stopEventPropagation?: MaybeAccessor<boolean | undefined>;
    refs?: {
      rootRef?: HTMLElement | null | undefined;
    };
    disabledIndices?: MaybeAccessor<number[] | undefined>;
    modifierKeys?: MaybeAccessor<ModifierKey[] | undefined>;
    highlightItemOnHover?: MaybeAccessor<boolean | undefined>;
  }
}
