'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { usePopoverRootContext } from '../root/PopoverRootContext';
/**
 * A button that closes the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverClose(props: PopoverClose.Props) {
  const [, , elementProps] = splitComponentProps(props, []);

  const { setOpen } = usePopoverRootContext();

  return (
    <RenderElement
      element="button"
      componentProps={props}
      ref={props.ref}
      params={{
        props: [
          {
            onClick(event) {
              setOpen(false, event, 'close-press');
            },
          },
          elementProps,
        ],
      }}
    />
  );
}

export namespace PopoverClose {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
