import { fieldValidityMapping } from '../../field/utils/constants';
import { type MaybeAccessor, access } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { RadioRootDataAttributes } from '../root/RadioRootDataAttributes';

export const customStyleHookMapping = {
  checked(value): Record<string, string> {
    if (access(value)) {
      return { [RadioRootDataAttributes.checked]: '' };
    }
    return { [RadioRootDataAttributes.unchecked]: '' };
  },
  ...transitionStatusMapping,
  ...fieldValidityMapping,
} satisfies CustomStyleHookMapping<{
  checked: MaybeAccessor<boolean>;
  transitionStatus: MaybeAccessor<TransitionStatus>;
  valid: MaybeAccessor<boolean | null>;
}>;
