'use client';
import { createMemo } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../solid-helpers';
import type { BaseUIComponentProps, Orientation } from '../utils/types';
import { useRenderElement } from '../utils/useRenderElement';

/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 */
export function Separator(componentProps: Separator.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['orientation']);
  const orientation = () => access(local.orientation) ?? 'horizontal';

  const state = createMemo<Separator.State>(() => ({
    orientation: orientation(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    props: [() => ({ role: 'separator', 'aria-orientation': orientation() }), elementProps],
  });

  return <>{element()}</>;
}

export namespace Separator {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The orientation of the separator.
     * @default 'horizontal'
     */
    orientation?: MaybeAccessor<Orientation | undefined>;
  }

  export interface State {
    /**
     * The orientation of the separator.
     */
    orientation: Orientation;
  }
}
