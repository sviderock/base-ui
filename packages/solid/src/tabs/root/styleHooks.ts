import type { Accessorify } from '../../floating-ui-solid';
import { access } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TabsRoot } from './TabsRoot';
import { TabsRootDataAttributes } from './TabsRootDataAttributes';

export const tabsStyleHookMapping: CustomStyleHookMapping<
  Accessorify<TabsRoot.State, 'maybeAccessor'>
> = {
  tabActivationDirection: (dir) => ({
    [TabsRootDataAttributes.activationDirection]: access(dir),
  }),
};
