'use client';
import { Show, type JSX } from 'solid-js';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useScrollAreaRootContext } from '../root/ScrollAreaRootContext';

/**
 * A small rectangular area that appears at the intersection of horizontal and vertical scrollbars.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Scroll Area](https://base-ui.com/react/components/scroll-area)
 */
export function ScrollAreaCorner(componentProps: ScrollAreaCorner.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);
  const context = useScrollAreaRootContext();

  const element = useRenderElement('div', componentProps, {
    ref: (el) => {
      context.refs.cornerRef = el;
    },
    props: [
      {
        get style(): JSX.CSSProperties {
          return {
            position: 'absolute',
            bottom: 0,
            'inset-inline-end': 0,
            width: `${context.cornerSize.width}px`,
            height: `${context.cornerSize.height}px`,
          };
        },
      },
      elementProps,
    ],
  });

  return <Show when={!context.hiddenState.cornerHidden}>{element()}</Show>;
}

export namespace ScrollAreaCorner {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
