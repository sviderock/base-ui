import { createContext, useContext, type Accessor } from 'solid-js';

export interface TabsListContext {
  activateOnFocus: Accessor<boolean>;
  highlightedTabIndex: Accessor<number>;
  onTabActivation: (newValue: any, event: Event) => void;
  setHighlightedTabIndex: (index: number) => void;
  refs: {
    tabsListRef: HTMLElement | null | undefined;
  };
  value: Accessor<any>;
}

export const TabsListContext = createContext<TabsListContext | undefined>(undefined);

export function useTabsListContext() {
  const context = useContext(TabsListContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.',
    );
  }

  return context;
}
