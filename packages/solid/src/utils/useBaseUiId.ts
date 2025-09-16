'use client';
import { type Accessor } from 'solid-js';
import { access, type MaybeAccessor } from '../solid-helpers';
import { useId } from './useId';

/**
 * Wraps `useId` and prefixes generated `id`s with `base-ui-`
 * @param {string | undefined} idOverride overrides the generated id when provided
 * @returns {string | undefined}
 */
export function useBaseUiId(
  idOverride?: MaybeAccessor<string | undefined>,
): Accessor<string | undefined> {
  const id = useId(idOverride, 'base-ui');
  return () => access(id);
}
