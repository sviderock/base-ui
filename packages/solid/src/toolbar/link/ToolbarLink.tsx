'use client';
import { createMemo, type ComponentProps } from 'solid-js';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';

const TOOLBAR_LINK_METADATA = {
  // links cannot be disabled, this metadata is only used for deriving `disabledIndices``
  // TODO: better name
  focusableWhenDisabled: true,
};

/**
 * A link component.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export function ToolbarLink(componentProps: ToolbarLink.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { orientation } = useToolbarRootContext();

  const state = createMemo<ToolbarLink.State>(() => ({
    orientation: orientation(),
  }));

  return (
    <CompositeItem<ToolbarRoot.ItemMetadata>
      metadata={TOOLBAR_LINK_METADATA}
      render={(p) => (
        <RenderElement
          element="a"
          componentProps={componentProps}
          ref={(el) => {
            if (p() && typeof p().ref === 'function') {
              (p().ref as Function)(el);
            } else {
              p().ref = el as unknown as HTMLDivElement;
            }
            if (typeof componentProps.ref === 'function') {
              componentProps.ref(el);
            } else {
              componentProps.ref = el;
            }
          }}
          params={{
            state: state(),
            props: [p() as ComponentProps<'a'>, elementProps],
          }}
        />
      )}
    />
  );
}

export namespace ToolbarLink {
  export interface State {
    orientation: ToolbarRoot.Orientation;
  }

  export interface Props extends BaseUIComponentProps<'a', State> {}
}
