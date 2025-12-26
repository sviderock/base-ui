'use client';
import { splitComponentProps } from '../solid-helpers';
import type { BaseUIComponentProps, Orientation } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElementV2';

/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 */
export function Separator(componentProps: Separator.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['orientation']);
  const orientation = () => local.orientation ?? 'horizontal';

  const state: Separator.State = {
    get orientation() {
      return orientation();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: [
      {
        role: 'separator',
        get 'aria-orientation'() {
          return orientation();
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace Separator {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The orientation of the separator.
     * @default 'horizontal'
     */
    orientation?: Orientation;
  }

  export interface State {
    /**
     * The orientation of the separator.
     */
    orientation: Orientation;
  }
}
