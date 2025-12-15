'use client';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from 'solid-js';
import { useDirection } from '../../direction-provider/DirectionContext';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { generateId } from '../../utils/generateId';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTabsListContext } from '../list/TabsListContext';
import { tabsStyleHookMapping } from '../root/styleHooks';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsTab } from '../tab/TabsTab';
import { script as prehydrationScript } from './prehydrationScript.min';
import { TabsIndicatorCssVars } from './TabsIndicatorCssVars';

const customStyleHookMapping = {
  ...tabsStyleHookMapping,
  selectedTabPosition: () => null,
  selectedTabSize: () => null,
};

/**
 * A visual indicator that can be styled to match the position of the currently active tab.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export function TabsIndicator(componentProps: TabsIndicator.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['renderBeforeHydration']);
  const renderBeforeHydration = () => access(local.renderBeforeHydration) ?? false;

  const { getTabElementBySelectedValue, orientation, tabActivationDirection, value } =
    useTabsRootContext();

  const { refs } = useTabsListContext();

  const [instanceId] = createSignal(generateId('tab'));
  const [isMounted, setIsMounted] = createSignal(false);
  const [meta, setMeta] = createSignal({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: 0,
    height: 0,
    isTabSelected: false,
  });
  const { value: activeTabValue } = useTabsRootContext();

  const direction = useDirection();

  onMount(() => {
    setIsMounted(true);
  });

  createEffect(() => {
    if (value() != null && refs.tabsListRef != null && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        setMeta((prev) => {
          if (value() != null && refs.tabsListRef != null) {
            const selectedTab = getTabElementBySelectedValue(value());
            const tabsList = refs.tabsListRef;

            if (selectedTab != null) {
              return {
                left: selectedTab.offsetLeft - tabsList.clientLeft,
                right:
                  direction() === 'ltr'
                    ? tabsList.scrollWidth -
                      selectedTab.offsetLeft -
                      selectedTab.offsetWidth -
                      tabsList.clientLeft
                    : selectedTab.offsetLeft - tabsList.clientLeft,
                top: selectedTab.offsetTop - tabsList.clientTop,
                bottom:
                  tabsList.scrollHeight -
                  selectedTab.offsetTop -
                  selectedTab.offsetHeight -
                  tabsList.clientTop,
                width: selectedTab.offsetWidth,
                height: selectedTab.offsetHeight,
                isTabSelected: true,
              };
            }
          }

          return prev;
        });
      });

      resizeObserver.observe(refs.tabsListRef);

      onCleanup(() => {
        resizeObserver.disconnect();
      });
    }

    return;
  });

  const selectedTabPosition = createMemo(() =>
    meta().isTabSelected
      ? { left: meta().left, right: meta().right, top: meta().top, bottom: meta().bottom }
      : null,
  );

  const selectedTabSize = createMemo(() =>
    meta().isTabSelected ? { width: meta().width, height: meta().height } : null,
  );

  const style = createMemo(() => {
    if (!meta().isTabSelected) {
      return undefined;
    }

    return {
      [TabsIndicatorCssVars.activeTabLeft]: `${meta().left}px`,
      [TabsIndicatorCssVars.activeTabRight]: `${meta().right}px`,
      [TabsIndicatorCssVars.activeTabTop]: `${meta().top}px`,
      [TabsIndicatorCssVars.activeTabBottom]: `${meta().bottom}px`,
      [TabsIndicatorCssVars.activeTabWidth]: `${meta().width}px`,
      [TabsIndicatorCssVars.activeTabHeight]: `${meta().height}px`,
    } as JSX.CSSProperties;
  });

  const displayIndicator = createMemo(
    () => meta().isTabSelected && meta().width > 0 && meta().height > 0,
  );

  const state = createMemo<TabsIndicator.State>(() => ({
    orientation: orientation(),
    selectedTabPosition: selectedTabPosition(),
    selectedTabSize: selectedTabSize(),
    tabActivationDirection: tabActivationDirection(),
  }));

  const element = useRenderElement('span', componentProps, {
    state,
    props: [
      () => ({
        role: 'presentation',
        style: style(),
        hidden: !displayIndicator(), // do not display the indicator before the layout is settled
      }),
      elementProps,
      () => ({
        ['data-instance-id' as string]: !(isMounted() && renderBeforeHydration())
          ? instanceId()
          : undefined,
        // // @ts-expect-error - suppressHydrationWarning is not a valid attribute for Solid
        // suppressHydrationWarning: true,
      }),
    ],
    customStyleHookMapping,
  });

  return (
    <Show when={activeTabValue() != null}>
      {element()}
      {!isMounted() && renderBeforeHydration() && (
        <script
          // eslint-disable-next-line solid/no-innerhtml
          innerHTML={prehydrationScript}
          // @ts-expect-error - suppressHydrationWarnings is not a valid attribute for Solid
          suppressHydrationWarnings
        />
      )}
    </Show>
  );
}

export namespace TabsIndicator {
  export interface State extends TabsRoot.State {
    selectedTabPosition: TabsTab.Position | null;
    selectedTabSize: TabsTab.Size | null;
    orientation: TabsRoot.Orientation;
  }

  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to render itself before Solid hydrates.
     * This minimizes the time that the indicator isn’t visible after server-side rendering.
     * @default false
     */
    renderBeforeHydration?: MaybeAccessor<boolean | undefined>;
  }
}
