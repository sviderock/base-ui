import { fieldValidityMapping } from '../field/utils/constants';
import type { Accessorify } from '../floating-ui-solid';
import { access } from '../solid-helpers';
import type { CustomStyleHookMapping } from '../utils/getStyleHookProps';
import type { SwitchRoot } from './root/SwitchRoot';
import { SwitchRootDataAttributes } from './root/SwitchRootDataAttributes';

export const styleHookMapping: CustomStyleHookMapping<
  Accessorify<SwitchRoot.State, 'maybeAccessor'>
> = {
  ...fieldValidityMapping,
  checked(value): Record<string, string> {
    if (access(value)) {
      return {
        [SwitchRootDataAttributes.checked]: '',
      };
    }

    return {
      [SwitchRootDataAttributes.unchecked]: '',
    };
  },
};
