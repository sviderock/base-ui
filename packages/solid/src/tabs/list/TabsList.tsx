'use client';
import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { tabsStyleHookMapping } from '../root/styleHooks';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsTab } from '../tab/TabsTab';
import { TabsListContext } from './TabsListContext';

const EMPTY_ARRAY: number[] = [];

/**
 * Groups the individual tab buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export function TabsList(componentProps: TabsList.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['activateOnFocus', 'loop']);
  const activateOnFocus = () => access(local.activateOnFocus) ?? true;
  const loop = () => access(local.loop) ?? true;

  const {
    getTabElementBySelectedValue,
    onValueChange,
    orientation,
    value,
    setTabArray,
    tabActivationDirection,
  } = useTabsRootContext();

  const [highlightedTabIndex, setHighlightedTabIndex] = createSignal(0);

  const refs: TabsListContext['refs'] = {
    tabsListRef: null,
  };

  const detectActivationDirection = useActivationDirectionDetector(
    value, // the old value
    orientation,
    () => refs.tabsListRef,
    getTabElementBySelectedValue,
  );

  const onTabActivation = (newValue: any, event: Event) => {
    if (newValue !== value()) {
      const activationDirection = detectActivationDirection(newValue);
      onValueChange(newValue, activationDirection, event);
    }
  };

  const state = createMemo<TabsList.State>(() => ({
    orientation: orientation(),
    tabActivationDirection: tabActivationDirection(),
  }));

  const tabsListContextValue: TabsListContext = {
    activateOnFocus,
    highlightedTabIndex,
    onTabActivation,
    setHighlightedTabIndex,
    refs,
    value,
  };

  return (
    <TabsListContext.Provider value={tabsListContextValue}>
      <CompositeRoot<TabsTab.Metadata>
        highlightedIndex={highlightedTabIndex()}
        enableHomeAndEndKeys
        loop={loop()}
        orientation={orientation()}
        onHighlightedIndexChange={setHighlightedTabIndex}
        onMapChange={(newMap) => {
          setTabArray(Array.from(newMap.entries()).map(([node, metadata]) => ({ node, metadata })));
        }}
        disabledIndices={EMPTY_ARRAY}
        render={(p) => (
          <RenderElement
            element="div"
            componentProps={componentProps}
            ref={(el) => {
              p().ref(el);
              refs.tabsListRef = el;
              if (typeof componentProps.ref === 'function') {
                componentProps.ref(el);
              } else {
                componentProps.ref = el;
              }
            }}
            params={{
              state: state(),
              customStyleHookMapping: tabsStyleHookMapping,
              props: [
                p(),
                {
                  'aria-orientation': orientation() === 'vertical' ? 'vertical' : undefined,
                  role: 'tablist',
                },
                elementProps,
              ],
            }}
          />
        )}
      />
    </TabsListContext.Provider>
  );
}

function getInset(tab: HTMLElement, tabsList: HTMLElement) {
  const { left: tabLeft, top: tabTop } = tab.getBoundingClientRect();
  const { left: listLeft, top: listTop } = tabsList.getBoundingClientRect();

  const left = tabLeft - listLeft;
  const top = tabTop - listTop;

  return { left, top };
}

function useActivationDirectionDetector(
  // the old value
  selectedTabValue: Accessor<any>,
  orientation: Accessor<TabsRoot.Orientation>,
  tabsListRef: Accessor<HTMLElement | null | undefined>,
  getTabElement: (selectedValue: any) => HTMLElement | null | undefined,
): (newValue: any) => TabsTab.ActivationDirection {
  let previousTabEdge = null as number | null;

  createEffect(() => {
    const ref = tabsListRef();
    // Whenever orientation changes, reset the state.
    if (selectedTabValue() == null || ref == null) {
      previousTabEdge = null;
      return;
    }

    const activeTab = getTabElement(selectedTabValue());
    if (activeTab == null) {
      previousTabEdge = null;
      return;
    }

    const { left, top } = getInset(activeTab, ref);
    previousTabEdge = orientation() === 'horizontal' ? left : top;
  });

  return (newValue: any) => {
    if (newValue === selectedTabValue()) {
      return 'none';
    }

    if (newValue == null) {
      previousTabEdge = null;
      return 'none';
    }

    const ref = tabsListRef();
    if (newValue != null && ref != null) {
      const selectedTabElement = getTabElement(newValue);

      if (selectedTabElement != null) {
        const { left, top } = getInset(selectedTabElement, ref);

        if (previousTabEdge == null) {
          previousTabEdge = orientation() === 'horizontal' ? left : top;
          return 'none';
        }

        if (orientation() === 'horizontal') {
          if (left < previousTabEdge) {
            previousTabEdge = left;
            return 'left';
          }
          if (left > previousTabEdge) {
            previousTabEdge = left;
            return 'right';
          }
        } else if (top < previousTabEdge) {
          previousTabEdge = top;
          return 'up';
        } else if (top > previousTabEdge) {
          previousTabEdge = top;
          return 'down';
        }
      }
    }

    return 'none';
  };
}

export namespace TabsList {
  export interface State extends TabsRoot.State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether to automatically change the active tab on arrow key focus.
     * Otherwise, tabs will be activated using Enter or Spacebar key press.
     * @default true
     */
    activateOnFocus?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: MaybeAccessor<boolean | undefined>;
  }
}
