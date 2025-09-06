import { combineProps } from '@solid-primitives/props';
import { type Accessor, type JSX } from 'solid-js';
import type { ElementProps } from '../types';
import { ACTIVE_KEY, FOCUSABLE_ATTRIBUTE, SELECTED_KEY } from '../utils/constants';

export type ExtendedUserProps = {
  [ACTIVE_KEY]?: boolean;
  [SELECTED_KEY]?: boolean;
};

export interface UseInteractionsReturn {
  getReferenceProps: <T extends Element>(
    userProps?: JSX.HTMLAttributes<T>,
  ) => Record<string, unknown>;
  getFloatingProps: <T extends HTMLElement>(
    userProps?: JSX.HTMLAttributes<T>,
  ) => Record<string, unknown>;
  getItemProps: <T extends HTMLElement>(
    userProps?: Omit<JSX.HTMLAttributes<T>, 'selected' | 'active'> & ExtendedUserProps,
  ) => Record<string, unknown>;
}

/**
 * Merges an array of interaction hooks' props into prop getters, allowing
 * event handler functions to be composed together without overwriting one
 * another.
 * @see https://floating-ui.com/docs/useInteractions
 */
export function useInteractions(
  propsList: Accessor<Array<ElementProps | void>> = () => [],
): UseInteractionsReturn {
  return {
    getReferenceProps(userProps) {
      const referenceList = propsList()
        .map((item) => item?.reference)
        .filter((i): i is JSX.HTMLAttributes<any> => !!i);

      if (userProps) {
        referenceList.push(userProps);
      }

      return combineProps(referenceList, { reverseEventHandlers: true });
    },
    getFloatingProps(userProps) {
      const list = propsList()
        .map((item) => item?.floating)
        .filter((i): i is JSX.HTMLAttributes<HTMLElement> => !!i);

      list.unshift({ tabIndex: -1, [FOCUSABLE_ATTRIBUTE as any]: '' });
      if (userProps) {
        list.push(userProps);
      }

      return combineProps(list, { reverseEventHandlers: true });
    },
    getItemProps(userProps) {
      const list = propsList()
        .map((item) => item?.item)
        .filter((i): i is JSX.HTMLAttributes<HTMLElement> => !!i);

      if (userProps) {
        list.push(userProps);
      }

      return combineProps(list, { reverseEventHandlers: true });
    },
  };
}

// if (isItem && userProps) {
//   if (key === ACTIVE_KEY || key === SELECTED_KEY) {
//     continue;
//   }
// }
