import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { CheckboxRoot } from '../root/CheckboxRoot';
import { CheckboxRootDataAttributes } from '../root/CheckboxRootDataAttributes';

export function useCustomStyleHookMapping(
  state: CheckboxRoot.State,
): CustomStyleHookMapping<CheckboxRoot.State> {
  return {
    checked(value): Record<string, string> {
      if (state.indeterminate) {
        // `data-indeterminate` is already handled by the `indeterminate` prop.
        return {};
      }

      if (value) {
        return {
          [CheckboxRootDataAttributes.checked]: '',
        };
      }

      return {
        [CheckboxRootDataAttributes.unchecked]: '',
      };
    },
  };
}
