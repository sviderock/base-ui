import type { Accessorify } from '@msviderok/base-ui-solid/floating-ui-solid';
import { access } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { ProgressRoot } from './ProgressRoot';
import { ProgressRootDataAttributes } from './ProgressRootDataAttributes';

export const progressStyleHookMapping: CustomStyleHookMapping<
  Accessorify<ProgressRoot.State, 'maybeAccessor'>
> = {
  status(value): Record<string, string> | null {
    if (access(value) === 'progressing') {
      return { [ProgressRootDataAttributes.progressing]: '' };
    }
    if (access(value) === 'complete') {
      return { [ProgressRootDataAttributes.complete]: '' };
    }
    if (access(value) === 'indeterminate') {
      return { [ProgressRootDataAttributes.indeterminate]: '' };
    }
    return null;
  },
};
