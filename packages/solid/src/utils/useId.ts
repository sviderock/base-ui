'use client';
import { createMemo, createUniqueId, type Accessor } from 'solid-js';
import { access, type MaybeAccessor } from '../solid-helpers';

/**
 *
 * @example
 * const id = useId();
 * return <div id={id()} />;
 *
 * @param idOverride
 * @returns {string}
 */
export function useId(
  idOverride?: MaybeAccessor<string | undefined>,
  prefix: string = 'mui',
): Accessor<string | undefined> {
  const id = createMemo(() => access(idOverride) || `${prefix}-${createUniqueId()}`);
  return id;
}
