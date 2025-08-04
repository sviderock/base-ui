import { createMemo, type Accessor, type JSX } from 'solid-js';
import type { ElementProps } from '../types';
import { ACTIVE_KEY, FOCUSABLE_ATTRIBUTE, SELECTED_KEY } from '../utils/constants';

export type ExtendedUserProps = {
  [ACTIVE_KEY]?: boolean;
  [SELECTED_KEY]?: boolean;
};

export interface UseInteractionsReturn {
  getReferenceProps: (userProps?: JSX.HTMLAttributes<Element>) => Record<string, unknown>;
  getFloatingProps: (userProps?: JSX.HTMLAttributes<HTMLElement>) => Record<string, unknown>;
  getItemProps: (
    userProps?: Omit<JSX.HTMLAttributes<HTMLElement>, 'selected' | 'active'> & ExtendedUserProps,
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
): Accessor<UseInteractionsReturn> {
  const returnValue = createMemo<UseInteractionsReturn>(() => ({
    getReferenceProps(userProps) {
      return mergeProps(userProps, propsList(), 'reference');
    },
    getFloatingProps(userProps) {
      // @ts-expect-error TODO: fix typing
      return mergeProps(userProps, propsList(), 'floating');
    },
    getItemProps(userProps) {
      // @ts-expect-error TODO: fix typing
      return mergeProps(userProps, propsList(), 'item');
    },
  }));

  return returnValue;
}

/* eslint-disable guard-for-in */

function mergeProps<Key extends keyof ElementProps>(
  userProps: (JSX.HTMLAttributes<Element> & ExtendedUserProps) | undefined,
  propsList: Array<ElementProps | void>,
  elementKey: Key,
): Record<string, unknown> {
  const eventHandlers = new Map<string, Array<(...args: unknown[]) => void>>();
  const isItem = elementKey === 'item';

  const outputProps = {} as Record<string, unknown>;

  if (elementKey === 'floating') {
    outputProps.tabIndex = -1;
    outputProps[FOCUSABLE_ATTRIBUTE] = '';
  }

  for (const key in userProps) {
    if (isItem && userProps) {
      if (key === ACTIVE_KEY || key === SELECTED_KEY) {
        continue;
      }
    }
    outputProps[key] = (userProps as any)[key];
  }

  for (let i = 0; i < propsList.length; i += 1) {
    let props;

    const propsOrGetProps = propsList[i]?.[elementKey];
    if (typeof propsOrGetProps === 'function') {
      props = userProps ? propsOrGetProps(userProps) : null;
    } else {
      props = propsOrGetProps;
    }
    if (!props) {
      continue;
    }

    mutablyMergeProps(outputProps, props, isItem, eventHandlers);
  }

  mutablyMergeProps(outputProps, userProps, isItem, eventHandlers);

  return outputProps;
}

function mutablyMergeProps(
  outputProps: Record<string, unknown>,
  props: any,
  isItem: boolean,
  eventHandlers: Map<string, Array<(...args: unknown[]) => void>>,
) {
  for (const key in props) {
    const value = (props as any)[key];

    if (isItem && (key === ACTIVE_KEY || key === SELECTED_KEY)) {
      continue;
    }

    if (!key.startsWith('on')) {
      outputProps[key] = value;
    } else {
      if (!eventHandlers.has(key)) {
        eventHandlers.set(key, []);
      }

      if (typeof value === 'function') {
        eventHandlers.get(key)?.push(value);

        outputProps[key] = (...args: unknown[]) => {
          return eventHandlers
            .get(key)
            ?.map((fn) => fn(...args))
            .find((val) => val !== undefined);
        };
      }
    }
  }
}
