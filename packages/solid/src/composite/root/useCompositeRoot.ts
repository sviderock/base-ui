'use client';
import { createEffect, createMemo, createSignal, mergeProps, type Accessor } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import { activeElement } from '../../floating-ui-solid/utils';
import { isElementDisabled } from '../../utils/isElementDisabled';
import { ownerDocument } from '../../utils/owner';
import type { HTMLProps } from '../../utils/types';
import {
  ALL_KEYS,
  ARROW_DOWN,
  ARROW_KEYS,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  END,
  HOME,
  HORIZONTAL_KEYS,
  HORIZONTAL_KEYS_WITH_EXTRA_KEYS,
  MODIFIER_KEYS,
  VERTICAL_KEYS,
  VERTICAL_KEYS_WITH_EXTRA_KEYS,
  createGridCellMap,
  findNonDisabledListIndex,
  getGridCellIndexOfCorner,
  getGridCellIndices,
  getGridNavigatedIndex,
  getMaxListIndex,
  getMinListIndex,
  isIndexOutOfListBounds,
  isListIndexDisabled,
  isNativeInput,
  scrollIntoViewIfNeeded,
  type Dimensions,
  type ModifierKey,
} from '../composite';
import { ACTIVE_COMPOSITE_ITEM } from '../constants';
import { type CompositeMetadata } from '../list/CompositeList';

export interface UseCompositeRootParameters {
  orientation?: 'horizontal' | 'vertical' | 'both' | undefined;
  cols?: number | undefined;
  loop?: boolean | undefined;
  highlightedIndex?: number | undefined;
  onHighlightedIndexChange?: (index: number) => void;
  dense?: boolean | undefined;
  itemSizes?: Array<Dimensions> | undefined;
  rootRef?: HTMLElement | undefined;
  /**
   * When `true`, pressing the Home key moves focus to the first item,
   * and pressing the End key moves focus to the last item.
   * @default false
   */
  enableHomeAndEndKeys?: boolean;
  /**
   * When `true`, keypress events on Composite's navigation keys
   * be stopped with event.stopPropagation()
   * @default false
   */
  stopEventPropagation?: boolean;
  /**
   * Array of item indices to be considered disabled.
   * Used for composite items that are focusable when disabled.
   */
  disabledIndices?: number[];
  /**
   * Array of [modifier key values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#modifier_keys) that should allow normal keyboard actions
   * when pressed. By default, all modifier keys prevent normal actions.
   * @default []
   */
  modifierKeys?: ModifierKey[];
}

const EMPTY_ARRAY: never[] = [];

export function useCompositeRoot(
  params: UseCompositeRootParameters,
  direction: Accessor<TextDirection>,
) {
  const mergedParams = mergeProps(
    {
      cols: 1,
      loop: true,
      dense: false,
      orientation: 'both',
      enableHomeAndEndKeys: false,
      stopEventPropagation: false,
      modifierKeys: EMPTY_ARRAY,
    } satisfies Partial<UseCompositeRootParameters>,
    params,
  );

  const [internalHighlightedIndex, internalSetHighlightedIndex] = createSignal(0);

  const isGrid = () => mergedParams.cols! > 1;

  const [rootRef, setRootRef] = createSignal<HTMLElement>();

  const [elements, setElements] = createStore<Array<HTMLDivElement | undefined>>([]);
  let hasSetDefaultIndexRef = false;

  const highlightedIndex = () => mergedParams.highlightedIndex ?? internalHighlightedIndex();
  function onHighlightedIndexChange(index: number, shouldScrollIntoView = false) {
    (mergedParams.onHighlightedIndexChange ?? internalSetHighlightedIndex)(index);
    if (shouldScrollIntoView) {
      const newActiveItem = elements[index];
      scrollIntoViewIfNeeded(rootRef(), newActiveItem, direction(), mergedParams.orientation);
    }
  }

  // Ensure external controlled updates moves focus to the highlighted item
  // if focus is currently inside the list.
  // https://github.com/mui/base-ui/issues/2101
  // TODO: Solid JS impolementation should be revisited. Patching with a signal for now.
  createEffect(() => {
    const activeEl = activeElement(ownerDocument(rootRef())) as HTMLDivElement | undefined;
    if (elements.includes(activeEl)) {
      const focusedItem = elements[highlightedIndex()];
      if (focusedItem && focusedItem !== activeEl) {
        focusedItem.focus();
      }
    }
  });

  function onMapChange(map: Map<Element, CompositeMetadata<any>>) {
    if (map.size === 0 || hasSetDefaultIndexRef) {
      return;
    }
    hasSetDefaultIndexRef = true;
    const sortedElements = Array.from(map.keys());
    const activeItem = sortedElements.find((compositeElement) =>
      compositeElement?.hasAttribute(ACTIVE_COMPOSITE_ITEM),
    ) as HTMLElement | undefined;
    // Set the default highlighted index of an arbitrary composite item.
    const activeIndex = activeItem ? sortedElements.indexOf(activeItem) : -1;
    if (activeIndex !== -1) {
      onHighlightedIndexChange(activeIndex);
    }

    scrollIntoViewIfNeeded(rootRef(), activeItem, direction(), mergedParams.orientation);
  }

  const props: Accessor<HTMLProps> = createMemo(() => ({
    'aria-orientation': mergedParams.orientation === 'both' ? undefined : mergedParams.orientation,
    // We need to capture the focus event in order to also trigger the focus event on the root element
    'on:focus': {
      capture: true,
      handleEvent: (event) => {
        if (!rootRef() || !isNativeInput(event.target)) {
          return;
        }
        event.target.setSelectionRange(0, event.target.value.length ?? 0);
      },
    },
    onKeyDown(event) {
      const RELEVANT_KEYS = mergedParams.enableHomeAndEndKeys ? ALL_KEYS : ARROW_KEYS;
      if (!RELEVANT_KEYS.has(event.key)) {
        return;
      }

      if (isModifierKeySet(event, mergedParams.modifierKeys)) {
        return;
      }

      if (!rootRef()) {
        return;
      }
      const isRtl = direction() === 'rtl';

      const horizontalForwardKey = isRtl ? ARROW_LEFT : ARROW_RIGHT;
      const forwardKey = {
        horizontal: horizontalForwardKey,
        vertical: ARROW_DOWN,
        both: horizontalForwardKey,
      }[mergedParams.orientation];
      const horizontalBackwardKey = isRtl ? ARROW_RIGHT : ARROW_LEFT;
      const backwardKey = {
        horizontal: horizontalBackwardKey,
        vertical: ARROW_UP,
        both: horizontalBackwardKey,
      }[mergedParams.orientation];

      if (isNativeInput(event.target) && !isElementDisabled(event.target)) {
        const selectionStart = event.target.selectionStart;
        const selectionEnd = event.target.selectionEnd;
        const textContent = event.target.value ?? '';
        // return to native textbox behavior when
        // 1 - Shift is held to make a text selection, or if there already is a text selection
        if (selectionStart == null || event.shiftKey || selectionStart !== selectionEnd) {
          return;
        }
        // 2 - arrow-ing forward and not in the last position of the text
        if (event.key !== backwardKey && selectionStart < textContent.length) {
          return;
        }
        // 3 -arrow-ing backward and not in the first position of the text
        if (event.key !== forwardKey && selectionStart > 0) {
          return;
        }
      }

      let nextIndex = highlightedIndex();
      const minIndex = getMinListIndex(elements, mergedParams.disabledIndices);
      const maxIndex = getMaxListIndex(elements, mergedParams.disabledIndices);

      if (isGrid()) {
        const sizes =
          mergedParams.itemSizes ||
          Array.from({ length: elements.length }, () => ({
            width: 1,
            height: 1,
          }));
        // To calculate movements on the grid, we use hypothetical cell indices
        // as if every item was 1x1, then convert back to real indices.
        const cellMap = createGridCellMap(sizes, mergedParams.cols, mergedParams.dense);
        const minGridIndex = cellMap.findIndex(
          (index) =>
            index != null && !isListIndexDisabled(elements, index, mergedParams.disabledIndices),
        );
        // last enabled index
        const maxGridIndex = cellMap.reduce(
          (foundIndex: number, index, cellIndex) =>
            index != null && !isListIndexDisabled(elements, index, mergedParams.disabledIndices)
              ? cellIndex
              : foundIndex,
          -1,
        );
        nextIndex = cellMap[
          getGridNavigatedIndex(
            cellMap.map((itemIndex) => (itemIndex ? elements[itemIndex] : undefined)),
            {
              event,
              orientation: mergedParams.orientation,
              loop: mergedParams.loop,
              cols: mergedParams.cols,
              // treat undefined (empty grid spaces) as disabled indices so we
              // don't end up in them
              disabledIndices: getGridCellIndices(
                [
                  ...(mergedParams.disabledIndices ||
                    elements.map((_, index) =>
                      isListIndexDisabled(elements, index) ? index : undefined,
                    )),
                  undefined,
                ],
                cellMap,
              ),
              minIndex: minGridIndex,
              maxIndex: maxGridIndex,
              prevIndex: getGridCellIndexOfCorner(
                highlightedIndex() > maxIndex ? minIndex : highlightedIndex(),
                sizes,
                cellMap,
                mergedParams.cols,
                // use a corner matching the edge closest to the direction we're
                // moving in so we don't end up in the same item. Prefer
                // top/left over bottom/right.

                event.key === ARROW_DOWN ? 'bl' : event.key === ARROW_RIGHT ? 'tr' : 'tl',
              ),
              rtl: isRtl,
            },
          )
        ] as number; // navigated cell will never be nullish
      }

      const forwardKeys = {
        horizontal: [horizontalForwardKey],
        vertical: [ARROW_DOWN],
        both: [horizontalForwardKey, ARROW_DOWN],
      }[mergedParams.orientation];

      const backwardKeys = {
        horizontal: [horizontalBackwardKey],
        vertical: [ARROW_UP],
        both: [horizontalBackwardKey, ARROW_UP],
      }[mergedParams.orientation];

      const preventedKeys = isGrid()
        ? RELEVANT_KEYS
        : {
            horizontal: mergedParams.enableHomeAndEndKeys
              ? HORIZONTAL_KEYS_WITH_EXTRA_KEYS
              : HORIZONTAL_KEYS,
            vertical: mergedParams.enableHomeAndEndKeys
              ? VERTICAL_KEYS_WITH_EXTRA_KEYS
              : VERTICAL_KEYS,
            both: RELEVANT_KEYS,
          }[mergedParams.orientation];

      if (mergedParams.enableHomeAndEndKeys) {
        if (event.key === HOME) {
          nextIndex = minIndex;
        } else if (event.key === END) {
          nextIndex = maxIndex;
        }
      }

      if (
        nextIndex === highlightedIndex() &&
        (forwardKeys.includes(event.key) || backwardKeys.includes(event.key))
      ) {
        if (mergedParams.loop && nextIndex === maxIndex && forwardKeys.includes(event.key)) {
          nextIndex = minIndex;
        } else if (
          mergedParams.loop &&
          nextIndex === minIndex &&
          backwardKeys.includes(event.key)
        ) {
          nextIndex = maxIndex;
        } else {
          nextIndex = findNonDisabledListIndex(elements, {
            startingIndex: nextIndex,
            decrement: backwardKeys.includes(event.key),
            disabledIndices: mergedParams.disabledIndices,
          });
        }
      }

      if (nextIndex !== highlightedIndex() && !isIndexOutOfListBounds(elements, nextIndex)) {
        if (mergedParams.stopEventPropagation) {
          event.stopPropagation();
        }

        if (preventedKeys.has(event.key)) {
          event.preventDefault();
        }
        onHighlightedIndexChange(nextIndex, true);

        // Wait for FocusManager `returnFocus` to execute.
        queueMicrotask(() => {
          elements[nextIndex]?.focus();
        });
      }
    },
  }));

  return {
    props,
    highlightedIndex,
    onHighlightedIndexChange,
    elements,
    setElements,
    disabledIndices: () => mergedParams.disabledIndices,
    onMapChange,
    rootRef,
    setRootRef: (el: HTMLElement | undefined) => {
      setRootRef(el);
      params.rootRef = el;
    },
  };
}

function isModifierKeySet(event: KeyboardEvent, ignoredModifierKeys: ModifierKey[]) {
  for (const key of MODIFIER_KEYS.values()) {
    if (ignoredModifierKeys.includes(key)) {
      continue;
    }
    if (event.getModifierState(key)) {
      return true;
    }
  }
  return false;
}
