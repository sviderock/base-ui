'use client';
import { createMemo, createSignal } from 'solid-js';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { Orientation as BaseOrientation, BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
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
  const cols = () => access(local.cols) ?? 1;
  const disabled = () => access(local.disabled) ?? false;
  const loop = () => access(local.loop) ?? true;
  const orientation = () => access(local.orientation) ?? 'horizontal';

  const [itemArray, setItemArray] = createSignal<
    Array<CompositeMetadata<ToolbarRoot.ItemMetadata> | null>
  >([]);

  const disabledIndices = createMemo(() => {
    const output: number[] = [];
    for (const itemMetadata of itemArray()) {
      if (itemMetadata?.index && !itemMetadata.focusableWhenDisabled) {
        output.push(itemMetadata.index);
      }
    }
    return output;
  });

  const toolbarRootContext: ToolbarRootContext = {
    disabled,
    orientation,
    setItemArray,
  };

  const state = createMemo<ToolbarRoot.State>(() => ({
    disabled: disabled(),
    orientation: orientation(),
  }));

  return (
    <ToolbarRootContext.Provider value={toolbarRootContext}>
      <CompositeRoot<ToolbarRoot.ItemMetadata>
        cols={cols()}
        disabledIndices={disabledIndices()}
        loop={loop()}
        onMapChange={(newMap) => {
          setItemArray(Array.from(newMap.values()));
        }}
        orientation={orientation()}
        render={(p) => (
          <RenderElement
            element="div"
            componentProps={componentProps}
            ref={(el) => {
              if (p() && typeof p().ref === 'function') {
                (p().ref as Function)(el);
              } else {
                p().ref = el;
              }
              if (typeof componentProps.ref === 'function') {
                componentProps.ref(el);
              } else {
                componentProps.ref = el;
              }
            }}
            params={{
              state: state(),
              props: [
                p(),
                {
                  'aria-orientation': orientation(),
                  role: 'toolbar',
                },
                elementProps,
              ],
            }}
          />
        )}
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
    cols?: MaybeAccessor<number | undefined>;
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * The orientation of the toolbar.
     * @type Toolbar.Root.Orientation
     * @default 'horizontal'
     */
    orientation?: MaybeAccessor<Orientation | undefined>;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.
     *
     * @default true
     */
    loop?: MaybeAccessor<boolean | undefined>;
  }
}
