'use client';
import { createEffect, on } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useSelectItemContext } from '../item/SelectItemContext';
import { useSelectRootContext } from '../root/SelectRootContext';

/**
 * A text label of the select item.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectItemText(componentProps: SelectItemText.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);
  let ref = null as HTMLElement | null | undefined;

  const { selected, refs } = useSelectItemContext();
  const { refs: rootRefs } = useSelectRootContext();

  createEffect(
    on(selected, () => {
      const hasNoSelectedItemText =
        rootRefs.selectedItemTextRef === null || !rootRefs.selectedItemTextRef?.isConnected;
      if (selected() || (hasNoSelectedItemText && refs.indexRef === 0)) {
        rootRefs.selectedItemTextRef = ref;
      }
    }),
  );

  const element = useRenderElement('div', componentProps, {
    ref: (el) => {
      ref = el;
      refs.textRef = el;
    },
    props: elementProps,
  });

  return <>{element()}</>;
}

export namespace SelectItemText {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
