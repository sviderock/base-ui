import { batch, createSignal } from 'solid-js';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { splitComponentProps } from '../../solid-helpers';
import type { Orientation as BaseOrientation, BaseUIComponentProps } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TabsPanel } from '../panel/TabsPanel';
import type { TabsTab } from '../tab/TabsTab';
import { TabsRootContext } from './TabsRootContext';
import { tabsStyleHookMapping } from './styleHooks';

/**
 * Groups the tabs and the corresponding panels.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export function TabsRoot(componentProps: TabsRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'defaultValue',
    'onValueChange',
    'orientation',
    'value',
  ]);
  const orientation = () => local.orientation ?? 'horizontal';

  const direction = useDirection();

  const tabPanelRefs: (HTMLElement | null | undefined)[] = [];

  const [value, setValue] = useControlled({
    controlled: () => local.value,
    default: () => local.defaultValue ?? 0,
    name: 'Tabs',
    state: 'value',
  });

  const [tabPanelArray, setTabPanelArray] = createSignal<
    Array<{ element: Element; metadata: CompositeMetadata<TabsPanel.Metadata> | null }>
  >([]);
  const [tabArray, setTabArray] = createSignal<
    Array<{ element: Element; metadata: CompositeMetadata<TabsTab.Metadata> | null }>
  >([]);

  const [tabActivationDirection, setTabActivationDirection] =
    createSignal<TabsTab.ActivationDirection>('none');

  const onValueChange = (
    newValue: TabsTab.Value,
    activationDirection: TabsTab.ActivationDirection,
    event: Event | undefined,
  ) => {
    batch(() => {
      setValue(newValue);
      setTabActivationDirection(activationDirection);
      local.onValueChange?.(newValue, event);
    });
  };

  // get the `id` attribute of <Tabs.Panel> to set as the value of `aria-controls` on <Tabs.Tab>
  const getTabPanelIdByTabValueOrIndex = (tabValue: TabsTab.Value | undefined, index: number) => {
    if (tabValue === undefined && index < 0) {
      return undefined;
    }

    for (const { metadata: tabPanelMetadata } of tabPanelArray()) {
      // find by tabValue
      if (tabValue !== undefined && tabPanelMetadata && tabValue === tabPanelMetadata?.value) {
        return tabPanelMetadata.id;
      }

      // find by index
      if (tabValue === undefined && tabPanelMetadata?.index && tabPanelMetadata?.index === index) {
        return tabPanelMetadata.id;
      }
    }

    return undefined;
  };

  // get the `id` attribute of <Tabs.Tab> to set as the value of `aria-labelledby` on <Tabs.Panel>
  const getTabIdByPanelValueOrIndex = (tabPanelValue: TabsTab.Value | undefined, index: number) => {
    if (tabPanelValue === undefined && index < 0) {
      return undefined;
    }

    for (const { metadata: tabMetadata } of tabArray()) {
      // find by tabPanelValue
      if (
        tabPanelValue !== undefined &&
        index > -1 &&
        tabPanelValue === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)
      ) {
        return tabMetadata?.id;
      }

      // find by index
      if (
        tabPanelValue === undefined &&
        index > -1 &&
        index === (tabMetadata?.value ?? tabMetadata?.index ?? undefined)
      ) {
        return tabMetadata?.id;
      }
    }

    return undefined;
  };

  // used in `useActivationDirectionDetector` for setting data-activation-direction
  const getTabElementBySelectedValue = (
    selectedValue: TabsTab.Value | undefined,
  ): HTMLElement | null => {
    if (selectedValue === undefined) {
      return null;
    }

    for (const { element, metadata } of tabArray()) {
      if (metadata != null && selectedValue === (metadata?.value ?? metadata?.index)) {
        return element as HTMLElement;
      }
    }

    return null;
  };

  const tabsContextValue: TabsRootContext = {
    direction,
    getTabElementBySelectedValue,
    getTabIdByPanelValueOrIndex,
    getTabPanelIdByTabValueOrIndex,
    onValueChange,
    orientation,
    setTabArray,
    tabActivationDirection,
    value,
  };

  const state: TabsRoot.State = {
    get orientation() {
      return orientation();
    },
    get tabActivationDirection() {
      return tabActivationDirection();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: elementProps,
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return (
    <TabsRootContext.Provider value={tabsContextValue}>
      <CompositeList<TabsPanel.Metadata>
        refs={{ elements: tabPanelRefs }}
        onMapChange={setTabPanelArray}
      >
        {element()}
      </CompositeList>
    </TabsRootContext.Provider>
  );
}

export namespace TabsRoot {
  export type Orientation = BaseOrientation;

  export type State = {
    /**
     * @type Tabs.Root.Orientation
     */
    orientation: Orientation;
    /**
     * @type Tabs.Tab.ActivationDirection
     */
    tabActivationDirection: TabsTab.ActivationDirection;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The value of the currently selected `Tab`. Use when the component is controlled.
     * When the value is `null`, no Tab will be selected.
     * @type Tabs.Tab.Value
     */
    value?: TabsTab.Value;
    /**
     * The default value. Use when the component is not controlled.
     * When the value is `null`, no Tab will be selected.
     * @type Tabs.Tab.Value
     * @default 0
     */
    defaultValue?: TabsTab.Value;
    /**
     * The component orientation (layout flow direction).
     * @type Tabs.Root.Orientation
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * Callback invoked when new value is being set.
     */
    onValueChange?: (value: TabsTab.Value, event?: Event) => void;
  }
}
