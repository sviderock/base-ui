'use client';
import { type Accessor, createMemo, createUniqueId } from 'solid-js';

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
  idOverride?: Accessor<string | undefined>,
  prefix: string = 'mui',
): Accessor<string | undefined> {
  const id = createMemo(() => idOverride?.() || `${prefix}-${createUniqueId()}`);
  return id;
}
