'use client';
import { createMemo } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { tabsStyleHookMapping } from '../root/styleHooks';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { TabsTab } from '../tab/TabsTab';
import { TabsPanelDataAttributes } from './TabsPanelDataAttributes';

/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export function TabsPanel(componentProps: TabsPanel.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'value',
    'keepMounted',
    'children',
  ]);
  const keepMounted = () => local.keepMounted ?? false;

  const {
    value: selectedValue,
    getTabIdByPanelValueOrIndex,
    orientation,
    tabActivationDirection,
  } = useTabsRootContext();

  const id = useBaseUiId();

  const metadata = createMemo(() => ({
    id: id(),
    value: local.value,
  }));

  const { setRef: setListItemRef, index } = useCompositeListItem({ metadata });

  const tabPanelValue = () => local.value ?? index();

  const hidden = () => tabPanelValue() !== selectedValue();

  const correspondingTabId = createMemo(() => {
    return getTabIdByPanelValueOrIndex(local.value, index());
  });

  const state: TabsPanel.State = {
    get hidden() {
      return hidden();
    },
    get orientation() {
      return orientation();
    },
    get tabActivationDirection() {
      return tabActivationDirection();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setListItemRef,
    props: [
      {
        role: 'tabpanel',
        get 'aria-labelledby'() {
          return correspondingTabId();
        },
        get hidden() {
          return hidden();
        },
        get id() {
          return id();
        },
        get tabIndex() {
          return hidden() ? -1 : 0;
        },
        get [TabsPanelDataAttributes.index as string]() {
          return index();
        },
      },
      elementProps,
    ],
    customStyleHookMapping: tabsStyleHookMapping,
    get children() {
      return <>{hidden() && !keepMounted() ? undefined : componentProps.children}</>;
    },
  });

  return <>{element()}</>;
}

export namespace TabsPanel {
  export interface Metadata {
    id?: string;
    value: TabsTab.Value;
  }

  export interface State extends TabsRoot.State {
    hidden: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The value of the TabPanel. It will be shown when the Tab with the corresponding value is selected.
     * If not provided, it will fall back to the index of the panel.
     * It is recommended to explicitly provide it, as it's required for the tab panel to be rendered on the server.
     * @type Tabs.Tab.Value
     */
    value?: TabsTab.Value;
    /**
     * Whether to keep the HTML element in the DOM while the panel is hidden.
     * @default false
     */
    keepMounted?: boolean;
  }
}
