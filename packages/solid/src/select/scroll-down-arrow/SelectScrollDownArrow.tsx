'use client';
import type { BaseUIComponentProps } from '../../utils/types';
import { SelectScrollArrow } from '../scroll-arrow/SelectScrollArrow';

/**
 * An element that scrolls the select menu down when hovered.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectScrollDownArrow(props: SelectScrollDownArrow.Props) {
  return <SelectScrollArrow {...props} ref={props.ref} direction="down" />;
}

export namespace SelectScrollDownArrow {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether to keep the HTML element in the DOM while the select menu is not scrollable.
     * @default false
     */
    keepMounted?: boolean;
  }
}
