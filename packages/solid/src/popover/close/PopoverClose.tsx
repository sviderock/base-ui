import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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

  const element = useRenderElement('button', props, {
    props: [
      {
        onClick(event) {
          setOpen(false, event, 'close-press');
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace PopoverClose {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}
