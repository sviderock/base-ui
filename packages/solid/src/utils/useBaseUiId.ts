'use client';
import { type Accessor } from 'solid-js';
import { useId } from './useId';

/**
 * Wraps `useId` and prefixes generated `id`s with `base-ui-`
 * @param {string | undefined} idOverride overrides the generated id when provided
 * @returns {string | undefined}
 */
export function useBaseUiId(idOverride?: string): Accessor<string | undefined> {
  return useId(idOverride, 'base-ui');
}
