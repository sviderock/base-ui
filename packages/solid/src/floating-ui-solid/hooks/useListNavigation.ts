import { isHTMLElement } from '@floating-ui/utils/dom';
import { batch, createEffect, createMemo, createSignal, onCleanup, type Accessor } from 'solid-js';
import {
  activeElement,
  contains,
  createGridCellMap,
  findNonDisabledListIndex,
  getDeepestNode,
  getDocument,
  getFloatingFocusElement,
  getGridCellIndexOfCorner,
  getGridCellIndices,
  getGridNavigatedIndex,
  getMaxListIndex,
  getMinListIndex,
  isIndexOutOfListBounds,
  isListIndexDisabled,
  isTypeableCombobox,
  isVirtualClick,
  isVirtualPointerEvent,
  stopEvent,
} from '../utils';

import type { MaybeAccessor, RefSignal } from '../../solid-helpers';
import { useFloatingParentNodeId, useFloatingTree } from '../components/FloatingTree';
import type { Dimensions, ElementProps, FloatingRootContext } from '../types';
import { ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, ARROW_UP } from '../utils/constants';
import { enqueueFocus } from '../utils/enqueueFocus';

export const ESCAPE = 'Escape';

function doSwitch(
  orientation: UseListNavigationProps['orientation'],
  vertical: boolean,
  horizontal: boolean,
) {
  switch (orientation?.()) {
    case 'vertical':
      return vertical;
    case 'horizontal':
      return horizontal;
    default:
      return vertical || horizontal;
  }
}

function isMainOrientationKey(key: string, orientation: UseListNavigationProps['orientation']) {
  const vertical = key === ARROW_UP || key === ARROW_DOWN;
  const horizontal = key === ARROW_LEFT || key === ARROW_RIGHT;
  return doSwitch(orientation, vertical, horizontal);
}

function isMainOrientationToEndKey(
  key: string,
  orientation: UseListNavigationProps['orientation'],
  rtl: boolean,
) {
  const vertical = key === ARROW_DOWN;
  const horizontal = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT;
  return (
    doSwitch(orientation, vertical, horizontal) || key === 'Enter' || key === ' ' || key === ''
  );
}

function isCrossOrientationOpenKey(
  key: string,
  orientation: UseListNavigationProps['orientation'],
  rtl: boolean,
) {
  const vertical = rtl ? key === ARROW_LEFT : key === ARROW_RIGHT;
  const horizontal = key === ARROW_DOWN;
  return doSwitch(orientation, vertical, horizontal);
}

function isCrossOrientationCloseKey(
  key: string,
  orientation: UseListNavigationProps['orientation'],
  rtl: boolean,
  cols?: number,
) {
  const vertical = rtl ? key === ARROW_RIGHT : key === ARROW_LEFT;
  const horizontal = key === ARROW_UP;
  if (orientation?.() === 'both' || (orientation?.() === 'horizontal' && cols && cols > 1)) {
    return key === ESCAPE;
  }
  return doSwitch(orientation, vertical, horizontal);
}

export interface UseListNavigationProps {
  /**
   * A ref that holds an array of list items.
   * @default empty list
   */
  listRef: Accessor<Array<HTMLElement | null | undefined>>;
  /**
   * The index of the currently active (focused or highlighted) item, which may
   * or may not be selected.
   * @default null
   */
  activeIndex: Accessor<number | null>;
  /**
   * A callback that is called when the user navigates to a new active item,
   * passed in a new `activeIndex`.
   */
  onNavigate?: (activeIndex: number | null) => void;
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: Accessor<boolean>;
  /**
   * The currently selected item index, which may or may not be active.
   * @default null
   */
  selectedIndex?: Accessor<number | null>;
  /**
   * Whether to focus the item upon opening the floating element. 'auto' infers
   * what to do based on the input type (keyboard vs. pointer), while a boolean
   * value will force the value.
   * @default 'auto'
   */
  focusItemOnOpen?: Accessor<boolean | 'auto'>;
  /**
   * Whether hovering an item synchronizes the focus.
   * @default true
   */
  focusItemOnHover?: Accessor<boolean>;
  /**
   * Whether pressing an arrow key on the navigation’s main axis opens the
   * floating element.
   * @default true
   */
  openOnArrowKeyDown?: Accessor<boolean>;
  /**
   * By default elements with either a `disabled` or `aria-disabled` attribute
   * are skipped in the list navigation — however, this requires the items to
   * be rendered.
   * This prop allows you to manually specify indices which should be disabled,
   * overriding the default logic.
   * For Windows-style select menus, where the menu does not open when
   * navigating via arrow keys, specify an empty array.
   * @default undefined
   */
  disabledIndices?: MaybeAccessor<Array<number>> | ((index?: number) => boolean);
  /**
   * Determines whether focus can escape the list, such that nothing is selected
   * after navigating beyond the boundary of the list. In some
   * autocomplete/combobox components, this may be desired, as screen
   * readers will return to the input.
   * `loop` must be `true`.
   * @default false
   */
  allowEscape?: Accessor<boolean>;
  /**
   * Determines whether focus should loop around when navigating past the first
   * or last item.
   * @default false
   */
  loop?: Accessor<boolean>;
  /**
   * If the list is nested within another one (e.g. a nested submenu), the
   * navigation semantics change.
   * @default false
   */
  nested?: Accessor<boolean>;
  /**
   * Allows to specify the orientation of the parent list, which is used to
   * determine the direction of the navigation.
   * This is useful when list navigation is used within a Composite,
   * as the hook can't determine the orientation of the parent list automatically.
   */
  parentOrientation?: UseListNavigationProps['orientation'];
  /**
   * Whether the direction of the floating element’s navigation is in RTL
   * layout.
   * @default false
   */
  rtl?: Accessor<boolean>;
  /**
   * Whether the focus is virtual (using `aria-activedescendant`).
   * Use this if you need focus to remain on the reference element
   * (such as an input), but allow arrow keys to navigate list items.
   * This is common in autocomplete listbox components.
   * Your virtually-focused list items must have a unique `id` set on them.
   * If you’re using a component role with the `useRole()` Hook, then an `id` is
   * generated automatically.
   * @default false
   */
  virtual?: Accessor<boolean>;
  /**
   * The orientation in which navigation occurs.
   * @default 'vertical'
   */
  orientation?: Accessor<'vertical' | 'horizontal' | 'both'>;
  /**
   * Specifies how many columns the list has (i.e., it’s a grid). Use an
   * orientation of 'horizontal' (e.g. for an emoji picker/date picker, where
   * pressing ArrowRight or ArrowLeft can change rows), or 'both' (where the
   * current row cannot be escaped with ArrowRight or ArrowLeft, only ArrowUp
   * and ArrowDown).
   * @default 1
   */
  cols?: Accessor<number | undefined>;
  /**
   * Whether to scroll the active item into view when navigating. The default
   * value uses nearest options.
   */
  scrollItemIntoView?: Accessor<boolean | ScrollIntoViewOptions>;
  /**
   * When using virtual focus management, this holds a ref to the
   * virtually-focused item. This allows nested virtual navigation to be
   * enabled, and lets you know when a nested element is virtually focused from
   * the root reference handling the events. Requires `FloatingTree` to be
   * setup.
   */
  virtualItemRef?: RefSignal<HTMLElement>;
  /**
   * Only for `cols > 1`, specify sizes for grid items.
   * `{ width: 2, height: 2 }` means an item is 2 columns wide and 2 rows tall.
   */
  itemSizes?: Accessor<Dimensions[]>;
  /**
   * Only relevant for `cols > 1` and items with different sizes, specify if
   * the grid is dense (as defined in the CSS spec for `grid-auto-flow`).
   * @default false
   */
  dense?: Accessor<boolean>;
}

/**
 * Adds arrow key-based navigation of a list of items, either using real DOM
 * focus or virtual focus.
 * @see https://floating-ui.com/docs/useListNavigation
 */
export function useListNavigation(
  context: FloatingRootContext,
  props: UseListNavigationProps,
): Accessor<ElementProps> {
  const enabled = () => props.enabled?.() ?? true;
  const selectedIndex = () => props.selectedIndex?.() ?? null;
  const allowEscape = () => props.allowEscape?.() ?? false;
  const loop = () => props.loop?.() ?? false;
  const nested = () => props.nested?.() ?? false;
  const rtl = () => props.rtl?.() ?? false;
  const virtual = () => props.virtual?.() ?? false;
  const focusItemOnHover = () => props.focusItemOnHover?.() ?? true;
  const openOnArrowKeyDown = () => props.openOnArrowKeyDown?.() ?? true;
  const orientation = () => props.orientation?.() ?? 'vertical';
  const cols = () => props.cols?.() ?? 1;
  const scrollItemIntoView = () => props.scrollItemIntoView?.() ?? true;
  const dense = () => props.dense?.() ?? false;
  const disabledIndices = createMemo(() => {
    if (typeof props.disabledIndices === 'function') {
      return props.disabledIndices.length > 0
        ? props.disabledIndices
        : (props.disabledIndices as Accessor<Array<number>>)();
    }
    return props.disabledIndices;
  });

  if (process.env.NODE_ENV !== 'production') {
    if (allowEscape()) {
      if (!loop()) {
        console.warn('`useListNavigation` looping must be enabled to allow escaping.');
      }

      if (!virtual()) {
        console.warn('`useListNavigation` must be virtual to allow escaping.');
      }
    }

    if (orientation() === 'vertical' && cols() > 1) {
      console.warn(
        'In grid list navigation mode (`cols` > 1), the `orientation` should',
        'be either "horizontal" or "both".',
      );
    }
  }

  const floatingFocusElement = () => {
    const floating = context.elements.floating();
    return getFloatingFocusElement(floating);
  };

  const parentId = useFloatingParentNodeId();
  const tree = useFloatingTree();

  createEffect(() => {
    context.dataRef.orientation = orientation();
  });

  const typeableComboboxReference = () => isTypeableCombobox(context.elements.domReference());

  let indexRef = selectedIndex() ?? -1;
  let keyRef: null | string = null;
  let isPointerModalityRef = true;

  const onNavigate = () => {
    props.onNavigate?.(indexRef === -1 ? null : indexRef);
  };

  let previousMountedRef = !!context.elements.floating();
  let previousOpenRef = context.open();
  let forceSyncFocusRef = false;
  let forceScrollIntoViewRef = false;

  const [focusItemOnOpen, setFocusItemOnOpen] = createSignal(props.focusItemOnOpen?.() ?? 'auto');
  const [activeId, setActiveId] = createSignal<string | undefined>();
  const [virtualId, setVirtualId] = createSignal<string | undefined>();

  const focusItem = () => {
    function runFocus(item: HTMLElement) {
      if (virtual()) {
        if (item.id?.endsWith('-fui-option')) {
          item.id = `${context.floatingId()}-${Math.random().toString(16).slice(2, 10)}`;
        }
        setActiveId(item.id);
        tree?.events.emit('virtualfocus', item);
        if (props.virtualItemRef?.ref()) {
          props.virtualItemRef.setRef(item);
        }
      } else {
        enqueueFocus(item, {
          sync: forceSyncFocusRef,
          preventScroll: true,
        });
      }
    }

    const initialItem = props.listRef()[indexRef];
    const forceScrollIntoView = forceScrollIntoViewRef;

    if (initialItem) {
      runFocus(initialItem);
    }

    const scheduler = forceSyncFocusRef ? (v: () => void) => v() : requestAnimationFrame;

    scheduler(() => {
      const waitedItem = props.listRef()[indexRef] || initialItem;

      if (!waitedItem) {
        return;
      }

      if (!initialItem) {
        runFocus(waitedItem);
      }

      const scrollIntoViewOptions = scrollItemIntoView();
      const shouldScrollIntoView =
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        scrollIntoViewOptions && item() && (forceScrollIntoView || !isPointerModalityRef);

      if (shouldScrollIntoView) {
        // JSDOM doesn't support `.scrollIntoView()` but it's widely supported
        // by all browsers.
        waitedItem.scrollIntoView?.(
          typeof scrollIntoViewOptions === 'boolean'
            ? { block: 'nearest', inline: 'nearest' }
            : scrollIntoViewOptions,
        );
      }
    });
  };

  // Sync `selectedIndex` to be the `activeIndex` upon opening the floating
  // element. Also, reset `activeIndex` upon closing the floating element.
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    if (context.open() && context.elements.floating()) {
      const selected = selectedIndex();
      if (focusItemOnOpen() && selected != null) {
        // Regardless of the pointer modality, we want to ensure the selected
        // item comes into view when the floating element is opened.
        forceScrollIntoViewRef = true;
        indexRef = selected;
        console.log(1);
        onNavigate();
      }
    } else if (previousMountedRef) {
      // Since the user can specify `onNavigate` conditionally
      // (onNavigate: open ? setActiveIndex : setSelectedIndex),
      // we store and call the previous function.
      indexRef = -1;
      console.log('OUTLIER');
      onNavigate();
    }
  });

  // Sync `activeIndex` to be the focused item while the floating element is
  // open.
  createEffect(() => {
    if (!enabled()) {
      return;
    }
    if (!context.open()) {
      return;
    }
    if (!context.elements.floating()) {
      return;
    }

    console.log(4, { activeIndex: props.activeIndex() });
    const activeIndex = props.activeIndex();
    if (activeIndex == null) {
      forceSyncFocusRef = false;

      if (selectedIndex() != null) {
        return;
      }

      // Reset while the floating element was open (e.g. the list changed).
      if (previousMountedRef) {
        indexRef = -1;
        focusItem();
      }

      // Initial sync.
      if (
        (!previousOpenRef || !previousMountedRef) &&
        focusItemOnOpen() &&
        (keyRef != null || (focusItemOnOpen() === true && keyRef == null))
      ) {
        let runs = 0;
        const waitForListPopulated = () => {
          if (props.listRef()[0] == null) {
            // Avoid letting the browser paint if possible on the first try,
            // otherwise use rAF. Don't try more than twice, since something
            // is wrong otherwise.
            if (runs < 2) {
              const scheduler = runs ? requestAnimationFrame : queueMicrotask;
              scheduler(waitForListPopulated);
            }
            runs += 1;
          } else {
            indexRef =
              keyRef == null || isMainOrientationToEndKey(keyRef, orientation, rtl()) || nested()
                ? getMinListIndex(props.listRef(), disabledIndices())
                : getMaxListIndex(props.listRef(), disabledIndices());
            keyRef = null;
            console.log(
              2,
              keyRef == null,
              isMainOrientationToEndKey(keyRef, orientation, rtl()),
              nested(),
              props.listRef().map((item) => item?.innerHTML),
              getMinListIndex(props.listRef(), disabledIndices()),
            );
            onNavigate();
          }
        };

        waitForListPopulated();
      }
    } else if (!isIndexOutOfListBounds(props.listRef(), activeIndex)) {
      console.log(3, { activeIndex });
      indexRef = activeIndex;
      focusItem();
      forceScrollIntoViewRef = false;
    }
  });

  // Ensure the parent floating element has focus when a nested child closes
  // to allow arrow key navigation to work after the pointer leaves the child.
  createEffect(() => {
    if (!enabled() || context.elements.floating() || !tree || virtual() || !previousMountedRef) {
      return;
    }

    const nodes = tree.nodesRef;
    const parent = nodes.find((node) => node.id === parentId())?.context?.elements.floating();
    const floating = context.elements.floating();
    const activeEl = activeElement(getDocument(floating));
    const treeContainsActiveEl = nodes.some(
      (node) => node.context && contains(node.context.elements.floating(), activeEl),
    );

    if (parent && !treeContainsActiveEl && isPointerModalityRef) {
      parent.focus({ preventScroll: true });
    }
  });

  createEffect(() => {
    if (!enabled()) {
      return;
    }
    if (!tree) {
      return;
    }
    if (!virtual()) {
      return;
    }
    if (parentId()) {
      return;
    }

    function handleVirtualFocus(item: HTMLElement) {
      setVirtualId(item.id);

      if (props.virtualItemRef?.ref()) {
        props.virtualItemRef.setRef(item);
      }
    }

    tree.events.on('virtualfocus', handleVirtualFocus);

    onCleanup(() => {
      tree.events.off('virtualfocus', handleVirtualFocus);
    });
  });

  createEffect(() => {
    previousOpenRef = context.open();
    previousMountedRef = !!context.elements.floating();
  });

  createEffect(() => {
    if (!context.open()) {
      keyRef = null;
      setFocusItemOnOpen(props.focusItemOnOpen?.() ?? 'auto');
    }
  });

  const hasActiveIndex = () => props.activeIndex() != null;

  const item = createMemo<ElementProps['item']>(() => {
    function syncCurrentTarget(currentTarget: HTMLElement | null) {
      if (!context.open()) {
        return;
      }
      const index = props.listRef().indexOf(currentTarget);
      if (index !== -1 && indexRef !== index) {
        indexRef = index;
        console.log(3);
        onNavigate();
      }
    }

    const itemProps: ElementProps['item'] = {
      onFocus({ currentTarget }) {
        forceSyncFocusRef = true;
        syncCurrentTarget(currentTarget);
      },
      onClick: ({ currentTarget }) => currentTarget.focus({ preventScroll: true }), // Safari
      onMouseMove({ currentTarget }) {
        forceSyncFocusRef = true;
        forceScrollIntoViewRef = false;
        if (focusItemOnHover()) {
          syncCurrentTarget(currentTarget);
        }
      },
      onPointerLeave({ pointerType }) {
        if (!isPointerModalityRef || pointerType === 'touch') {
          return;
        }

        forceSyncFocusRef = true;

        if (!focusItemOnHover()) {
          return;
        }

        indexRef = -1;
        console.log(4);
        onNavigate();

        if (!virtual()) {
          floatingFocusElement()?.focus({ preventScroll: true });
        }
      },
    };

    return itemProps;
  });

  const getParentOrientation = () => {
    return (
      props.parentOrientation?.() ??
      (tree?.nodesRef
        .find((node) => node.id === parentId())
        ?.context?.dataRef.orientation() as ReturnType<
        Exclude<UseListNavigationProps['orientation'], undefined>
      >)
    );
  };

  const commonOnKeyDown = (event: KeyboardEvent) => {
    console.log('common keydown', event.key);
    isPointerModalityRef = false;
    forceSyncFocusRef = true;

    console.log(11);
    // When composing a character, Chrome fires ArrowDown twice. Firefox/Safari
    // don't appear to suffer from this. `event.isComposing` is avoided due to
    // Safari not supporting it properly (although it's not needed in the first
    // place for Safari, just avoiding any possible issues).
    if (event.which === 229) {
      return;
    }
    console.log(22);

    // If the floating element is animating out, ignore navigation. Otherwise,
    // the `activeIndex` gets set to 0 despite not being open so the next time
    // the user ArrowDowns, the first item won't be focused.
    if (!context.open() && event.currentTarget === floatingFocusElement()) {
      return;
    }
    console.log(33);

    if (nested() && isCrossOrientationCloseKey(event.key, orientation, rtl(), cols())) {
      // If the nested list's close key is also the parent navigation key,
      // let the parent navigate. Otherwise, stop propagating the event.
      if (!isMainOrientationKey(event.key, getParentOrientation)) {
        stopEvent(event);
      }
      console.log('list-navigation', 1);
      context.onOpenChange(false, event, 'list-navigation');

      const domReference = context.elements.domReference();
      if (isHTMLElement(domReference)) {
        if (virtual()) {
          tree?.events.emit('virtualfocus', domReference);
        } else {
          domReference.focus();
        }
      }

      return;
    }

    console.log(44);

    const currentIndex = indexRef;
    const minIndex = getMinListIndex(props.listRef(), disabledIndices());
    const maxIndex = getMaxListIndex(props.listRef(), disabledIndices());

    if (!typeableComboboxReference()) {
      if (event.key === 'Home') {
        stopEvent(event);
        indexRef = minIndex;
        console.log(5);
        onNavigate();
      }

      if (event.key === 'End') {
        stopEvent(event);
        indexRef = maxIndex;
        console.log(6);
        onNavigate();
      }
    }

    console.log(55);
    // Grid navigation.
    if (cols() > 1) {
      const sizes =
        props.itemSizes?.() ||
        Array.from({ length: props.listRef().length }, () => ({
          width: 1,
          height: 1,
        }));
      // To calculate movements on the grid, we use hypothetical cell indices
      // as if every item was 1x1, then convert back to real indices.
      console.log(111, {
        itemSizes: props.itemSizes?.(),
        sizes,
        cols: cols(),
        dense: dense(),
        listRef: props.listRef().map((item) => item?.innerHTML),
      });
      const cellMap = createGridCellMap(sizes, cols(), dense());
      const minGridIndex = cellMap.findIndex(
        (index) => index != null && !isListIndexDisabled(props.listRef(), index, disabledIndices()),
      );
      // last enabled index
      const maxGridIndex = cellMap.reduce(
        (foundIndex: number, index, cellIndex) =>
          index != null && !isListIndexDisabled(props.listRef(), index, disabledIndices())
            ? cellIndex
            : foundIndex,
        -1,
      );

      console.log(112, { minGridIndex, maxGridIndex });
      console.log(66);

      const index =
        cellMap[
          getGridNavigatedIndex(
            cellMap.map((itemIndex) => (itemIndex != null ? props.listRef()[itemIndex] : null)),
            {
              event,
              orientation: orientation(),
              loop: loop(),
              rtl: rtl(),
              cols: cols(),
              // treat undefined (empty grid spaces) as disabled indices so we
              // don't end up in them
              // TODO: I'm not sure if this is "the best" way to do this
              disabledIndices: () =>
                getGridCellIndices(
                  [
                    ...props
                      .listRef()
                      .map((_, listIndex) =>
                        isListIndexDisabled(props.listRef(), listIndex, disabledIndices())
                          ? listIndex
                          : undefined,
                      ),
                    undefined,
                  ],
                  cellMap,
                ),
              minIndex: minGridIndex,
              maxIndex: maxGridIndex,
              prevIndex: getGridCellIndexOfCorner(
                indexRef > maxIndex ? minIndex : indexRef,
                sizes,
                cellMap,
                cols(),
                // use a corner matching the edge closest to the direction
                // we're moving in so we don't end up in the same item. Prefer
                // top/left over bottom/right.
                // eslint-disable-next-line no-nested-ternary
                event.key === ARROW_DOWN
                  ? 'bl'
                  : event.key === (rtl() ? ARROW_LEFT : ARROW_RIGHT)
                    ? 'tr'
                    : 'tl',
              ),
              stopEvent: true,
            },
          )
        ];

      console.log(77, { index, cellMap });
      if (index != null) {
        indexRef = index;
        console.log(7);
        onNavigate();
      }

      if (orientation() === 'both') {
        return;
      }
    }

    console.log(isMainOrientationKey(event.key, orientation), orientation());
    if (isMainOrientationKey(event.key, orientation)) {
      console.log(88);
      stopEvent(event);

      // Reset the index if no item is focused.
      if (
        context.open() &&
        !virtual() &&
        activeElement((event.currentTarget as any)?.ownerDocument) === event.currentTarget
      ) {
        indexRef = isMainOrientationToEndKey(event.key, orientation, rtl()) ? minIndex : maxIndex;
        console.log(8);
        onNavigate();
        return;
      }

      if (isMainOrientationToEndKey(event.key, orientation, rtl())) {
        if (loop()) {
          indexRef =
            // eslint-disable-next-line no-nested-ternary
            currentIndex >= maxIndex
              ? allowEscape() && currentIndex !== props.listRef().length
                ? -1
                : minIndex
              : findNonDisabledListIndex(props.listRef(), {
                  startingIndex: currentIndex,
                  disabledIndices: disabledIndices(),
                });
        } else {
          indexRef = Math.min(
            maxIndex,
            findNonDisabledListIndex(props.listRef(), {
              startingIndex: currentIndex,
              disabledIndices: disabledIndices(),
            }),
          );
        }
      } else if (loop()) {
        indexRef =
          // eslint-disable-next-line no-nested-ternary
          currentIndex <= minIndex
            ? allowEscape() && currentIndex !== -1
              ? props.listRef().length
              : maxIndex
            : findNonDisabledListIndex(props.listRef(), {
                startingIndex: currentIndex,
                decrement: true,
                disabledIndices: disabledIndices(),
              });
      } else {
        indexRef = Math.max(
          minIndex,
          findNonDisabledListIndex(props.listRef(), {
            startingIndex: currentIndex,
            decrement: true,
            disabledIndices: disabledIndices(),
          }),
        );
      }

      if (isIndexOutOfListBounds(props.listRef(), indexRef)) {
        indexRef = -1;
      }

      console.log(9);
      onNavigate();
    }
  };

  const ariaActiveDescendantProp = () => {
    return (
      virtual() &&
      context.open() &&
      hasActiveIndex() && {
        'aria-activedescendant': virtualId() || activeId(),
      }
    );
  };

  const floating = createMemo<ElementProps['floating']>(() => {
    const typesafeOrientation = orientation();
    return {
      'aria-orientation': typesafeOrientation === 'both' ? undefined : typesafeOrientation,
      ...(!typeableComboboxReference() ? ariaActiveDescendantProp() : {}),
      'on:keydown': commonOnKeyDown,
      'on:pointermove': () => {
        isPointerModalityRef = true;
      },
    };
  });

  const reference = createMemo<ElementProps['reference']>(() => {
    // TODO: This is a hack to get the event type to work.
    function checkVirtualMouse(event: MouseEvent) {
      if (focusItemOnOpen() === 'auto' && isVirtualClick(event)) {
        setFocusItemOnOpen(true);
      }
    }

    function checkVirtualPointer(event: PointerEvent) {
      // `pointerdown` fires first, reset the state then perform the checks.
      setFocusItemOnOpen(focusItemOnOpen());
      if (focusItemOnOpen() === 'auto' && isVirtualPointerEvent(event)) {
        setFocusItemOnOpen(true);
      }
    }

    return {
      ...ariaActiveDescendantProp(),
      'on:keydown': (event) => {
        isPointerModalityRef = false;

        /**
         * We need to store the open state at the start of the function
         * because changes in Solid's state are synchronous, while the
         * React's state is asynchronous.
         */
        const openAtStart = context.open();

        const isArrowKey = event.key.startsWith('Arrow');
        const isHomeOrEndKey = ['Home', 'End'].includes(event.key);
        const isMoveKey = isArrowKey || isHomeOrEndKey;
        const isCrossOpenKey = isCrossOrientationOpenKey(event.key, orientation, rtl());
        const isCrossCloseKey = isCrossOrientationCloseKey(event.key, orientation, rtl(), cols());
        const isParentCrossOpenKey = isCrossOrientationOpenKey(
          event.key,
          getParentOrientation,
          rtl(),
        );
        const isMainKey = isMainOrientationKey(event.key, orientation);
        const isNavigationKey =
          (nested() ? isParentCrossOpenKey : isMainKey) ||
          event.key === 'Enter' ||
          event.key.trim() === '';

        console.log(event.key, { virtual: virtual(), openAtStart });
        if (virtual() && openAtStart) {
          const rootNode = tree?.nodesRef.find((node) => node.parentId == null);
          const deepestNode = tree && rootNode ? getDeepestNode(tree.nodesRef, rootNode.id) : null;

          if (isMoveKey && deepestNode && props.virtualItemRef?.ref()) {
            const eventObject = new KeyboardEvent('keydown', {
              key: event.key,
              bubbles: true,
            });

            if (isCrossOpenKey || isCrossCloseKey) {
              const isCurrentTarget =
                deepestNode.context?.elements.domReference() === event.currentTarget;
              const dispatchItem =
                // eslint-disable-next-line no-nested-ternary
                isCrossCloseKey && !isCurrentTarget
                  ? deepestNode.context?.elements.domReference()
                  : isCrossOpenKey
                    ? props.listRef().find((currentItem) => currentItem?.id === activeId())
                    : null;

              if (dispatchItem) {
                stopEvent(event);
                dispatchItem.dispatchEvent(eventObject);
                setVirtualId(undefined);
              }
            }

            if ((isMainKey || isHomeOrEndKey) && deepestNode.context) {
              if (
                deepestNode.context.open() &&
                deepestNode.parentId &&
                event.currentTarget !== deepestNode.context.elements.domReference()
              ) {
                stopEvent(event);
                deepestNode.context.elements.domReference()?.dispatchEvent(eventObject);
                return undefined;
              }
            }
          }

          return commonOnKeyDown(event);
        }

        // If a floating element should not open on arrow key down, avoid
        // setting `activeIndex` while it's closed.
        if (!openAtStart && !openOnArrowKeyDown() && isArrowKey) {
          return undefined;
        }

        if (isNavigationKey) {
          const isParentMainKey = isMainOrientationKey(event.key, getParentOrientation);
          keyRef = nested() && isParentMainKey ? null : event.key;
        }

        if (nested()) {
          if (isParentCrossOpenKey) {
            stopEvent(event);

            console.log('AAAAA');
            if (openAtStart) {
              indexRef = getMinListIndex(props.listRef(), disabledIndices());
              console.log(10);
              onNavigate();
            } else {
              console.log('list-navigation', 2);
              context.onOpenChange(true, event, 'list-navigation');
            }
          }

          return undefined;
        }

        if (isMainKey) {
          const selected = selectedIndex();
          if (selected != null) {
            indexRef = selected;
          }

          stopEvent(event);

          if (!openAtStart && openOnArrowKeyDown()) {
            /**
             * This will cause a synchronous change in the open state which
             * failes the next check for openAtStart.
             */
            console.log('list-navigation', 3);
            context.onOpenChange(true, event, 'list-navigation');
          } else {
            commonOnKeyDown(event);
          }

          if (openAtStart) {
            console.log(11);
            onNavigate();
          }
        }

        return undefined;
      },
      'on:focus': () => {
        if (context.open() && !virtual()) {
          indexRef = -1;
          console.log(12);
          onNavigate();
        }
      },
      'on:pointerdown': checkVirtualPointer,
      'on:pointerenter': checkVirtualPointer,
      'on:mousedown': checkVirtualMouse,
      'on:click': checkVirtualMouse,
    };
  });

  const returnValue = createMemo<ElementProps>(() => {
    if (!enabled()) {
      return {};
    }

    return { reference: reference(), floating: floating(), item: item() };
  });

  return returnValue;
}
