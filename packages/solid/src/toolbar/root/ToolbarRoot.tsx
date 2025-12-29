'use client';
import { createMemo, createSignal } from 'solid-js';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { splitComponentProps } from '../../solid-helpers';
import { Orientation as BaseOrientation, BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ToolbarRootContext } from './ToolbarRootContext';

/**
 * A container for grouping a set of controls, such as buttons, toggle groups, or menus.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export function ToolbarRoot(componentProps: ToolbarRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'cols',
    'disabled',
    'loop',
    'orientation',
  ]);
  const cols = () => local.cols ?? 1;
  const disabled = () => local.disabled ?? false;
  const loop = () => local.loop ?? true;
  const orientation = () => local.orientation ?? 'horizontal';

  const [itemArray, setItemArray] = createSignal<
    Array<{ element: Element; metadata: CompositeMetadata<ToolbarRoot.ItemMetadata> | null }>
  >([]);

  const disabledIndices = createMemo(() => {
    const output: number[] = [];
    for (const { metadata } of itemArray()) {
      const idx = metadata?.index;
      if (idx && !metadata?.focusableWhenDisabled) {
        output.push(idx);
      }
    }
    return output;
  });

  const toolbarRootContext: ToolbarRootContext = {
    disabled,
    orientation,
    setItemArray,
  };

  const state: ToolbarRoot.State = {
    get disabled() {
      return disabled();
    },
    get orientation() {
      return orientation();
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: [
      {
        get 'aria-orientation'() {
          return orientation();
        },
        role: 'toolbar',
      },
      elementProps,
    ],
  });

  return (
    <ToolbarRootContext.Provider value={toolbarRootContext}>
      <CompositeRoot<ToolbarRoot.ItemMetadata>
        cols={cols()}
        disabledIndices={disabledIndices()}
        loop={loop()}
        onMapChange={setItemArray}
        orientation={orientation()}
        render={element}
      />
    </ToolbarRootContext.Provider>
  );
}

export namespace ToolbarRoot {
  export interface ItemMetadata {
    focusableWhenDisabled: boolean;
  }

  export type Orientation = BaseOrientation;

  export type State = {
    disabled: boolean;
    orientation: Orientation;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The number of columns. When greater than 1, the toolbar is arranged into
     * a grid.
     * @default 1
     */
    cols?: number;
    disabled?: boolean;
    /**
     * The orientation of the toolbar.
     * @type Toolbar.Root.Orientation
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.
     *
     * @default true
     */
    loop?: boolean;
  }
}
