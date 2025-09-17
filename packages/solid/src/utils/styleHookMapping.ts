import { access, type MaybeAccessor } from '../solid-helpers';
import type { CustomStyleHookMapping } from './getStyleHookProps';
import type { TransitionStatus } from './useTransitionStatus';

export enum TransitionStatusDataAttributes {
  /**
   * Present when the component is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the component is animating out.
   */
  endingStyle = 'data-ending-style',
}

const STARTING_HOOK = { [TransitionStatusDataAttributes.startingStyle]: '' };
const ENDING_HOOK = { [TransitionStatusDataAttributes.endingStyle]: '' };

export const transitionStatusMapping = {
  transitionStatus(value): Record<string, string> | null {
    if (access(value) === 'starting') {
      return STARTING_HOOK;
    }
    if (access(value) === 'ending') {
      return ENDING_HOOK;
    }
    return null;
  },
} satisfies CustomStyleHookMapping<{ transitionStatus: MaybeAccessor<TransitionStatus> }>;
