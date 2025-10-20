'use client';
import { type MaybeAccessor } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { SelectScrollArrow } from '../scroll-arrow/SelectScrollArrow';

/**
 * An element that scrolls the select menu up when hovered.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectScrollUpArrow(props: SelectScrollUpArrow.Props) {
  return <SelectScrollArrow {...props} ref={props.ref} direction="up" />;
}

export namespace SelectScrollUpArrow {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether to keep the HTML element in the DOM while the select menu is not scrollable.
     * @default false
     */
    keepMounted?: MaybeAccessor<boolean | undefined>;
  }
}
