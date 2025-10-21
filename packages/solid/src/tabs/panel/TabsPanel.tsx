'use client';
import { createMemo } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
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
  const [, local, elementProps] = splitComponentProps(componentProps, ['value', 'keepMounted']);
  const valueProp = () => access(local.value);
  const keepMounted = () => access(local.keepMounted) ?? false;

  const {
    value: selectedValue,
    getTabIdByPanelValueOrIndex,
    orientation,
    tabActivationDirection,
  } = useTabsRootContext();

  const id = useBaseUiId();

  const metadata = createMemo(() => ({
    id: id(),
    value: valueProp(),
  }));

  const { setRef: setListItemRef, index } = useCompositeListItem({ metadata });

  const tabPanelValue = () => valueProp() ?? index();

  const hidden = () => tabPanelValue() !== selectedValue();

  const correspondingTabId = createMemo(() => {
    return getTabIdByPanelValueOrIndex(valueProp(), index());
  });

  const state = createMemo<TabsPanel.State>(() => ({
    hidden: hidden(),
    orientation: orientation(),
    tabActivationDirection: tabActivationDirection(),
  }));

  return (
    <RenderElement
      element="div"
      componentProps={{
        ...componentProps,
        children: hidden() && !keepMounted() ? undefined : componentProps.children,
      }}
      ref={(el) => {
        setListItemRef(el);
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{
        state: state(),
        props: [
          {
            'aria-labelledby': correspondingTabId(),
            hidden: hidden(),
            id: id(),
            role: 'tabpanel',
            tabIndex: hidden() ? -1 : 0,
            [TabsPanelDataAttributes.index as string]: index(),
          },
          elementProps,
        ],
        customStyleHookMapping: tabsStyleHookMapping,
      }}
    />
  );
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
    value?: MaybeAccessor<TabsTab.Value | undefined>;
    /**
     * Whether to keep the HTML element in the DOM while the panel is hidden.
     * @default false
     */
    keepMounted?: MaybeAccessor<boolean | undefined>;
  }
}
