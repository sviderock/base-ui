'use client';
import { onMount } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { usePopoverRootContext } from '../root/PopoverRootContext';

/**
 * A paragraph with additional information about the popover.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverDescription(componentProps: PopoverDescription.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { setCodependentRefs } = usePopoverRootContext();

  const id = useBaseUiId(() => elementProps.id);

  let ref: HTMLElement;

  onMount(() => {
    setCodependentRefs('description', {
      explicitId: id,
      ref: () => ref,
      id: () => elementProps.id,
    });
  });

  const element = useRenderElement('p', componentProps, {
    ref: (el) => {
      ref = el;
    },
    props: [
      {
        get id() {
          return id();
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace PopoverDescription {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'p', State> {}
}
