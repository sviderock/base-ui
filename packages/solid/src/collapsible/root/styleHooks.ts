import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { CollapsibleRoot } from './CollapsibleRoot';

export const collapsibleStyleHookMapping: CustomStyleHookMapping<CollapsibleRoot.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};
