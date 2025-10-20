'use client';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
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

  const { selected, refs } = useSelectItemContext();
  const { refs: rootRefs } = useSelectRootContext();

  const localRef = (node: HTMLElement | null | undefined) => {
    if (!node) {
      return;
    }
    // Wait for the DOM indices to be set.
    queueMicrotask(() => {
      const hasNoSelectedItemText =
        rootRefs.selectedItemTextRef === null || !rootRefs.selectedItemTextRef?.isConnected;
      if (selected() || (hasNoSelectedItemText && refs.indexRef === 0)) {
        rootRefs.selectedItemTextRef = node;
      }
    });
  };

  return (
    <RenderElement
      element="div"
      componentProps={componentProps}
      ref={(el) => {
        localRef(el);
        refs.textRef = el;
        if (typeof componentProps.ref === 'function') {
          componentProps.ref(el);
        } else {
          componentProps.ref = el;
        }
      }}
      params={{ props: elementProps }}
    />
  );
}

export namespace SelectItemText {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}
