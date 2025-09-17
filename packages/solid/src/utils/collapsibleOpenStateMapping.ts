import { CollapsiblePanelDataAttributes } from '../collapsible/panel/CollapsiblePanelDataAttributes';
import { CollapsibleTriggerDataAttributes } from '../collapsible/trigger/CollapsibleTriggerDataAttributes';
import { type MaybeAccessor, access } from '../solid-helpers';
import type { CustomStyleHookMapping } from './getStyleHookProps';

const PANEL_OPEN_HOOK = {
  [CollapsiblePanelDataAttributes.open]: '',
};

const PANEL_CLOSED_HOOK = {
  [CollapsiblePanelDataAttributes.closed]: '',
};

export const triggerOpenStateMapping: CustomStyleHookMapping<{
  open: MaybeAccessor<boolean>;
}> = {
  open(value) {
    if (access(value)) {
      return {
        [CollapsibleTriggerDataAttributes.panelOpen]: '',
      };
    }
    return null;
  },
};

export const collapsibleOpenStateMapping = {
  open(value) {
    if (access(value)) {
      return PANEL_OPEN_HOOK;
    }
    return PANEL_CLOSED_HOOK;
  },
} satisfies CustomStyleHookMapping<{
  open: MaybeAccessor<boolean>;
}>;
