'use client';
import { type ComponentProps } from 'solid-js';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useFloatingTree } from '../../floating-ui-solid';
import { splitComponentProps } from '../../solid-helpers';
import type { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { isOutsideMenuEvent } from '../utils/isOutsideMenuEvent';

/**
 * A link in the navigation menu that can be used to navigate to a different page or section.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuLink(componentProps: NavigationMenuLink.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { setValue, popupElement, refs, floatingRootContext } = useNavigationMenuRootContext();
  const nodeId = useNavigationMenuTreeContext();
  const tree = useFloatingTree();

  return (
    <CompositeItem
      tabIndex={undefined}
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
            props: [
              p() as ComponentProps<'a'>,
              {
                onBlur(event) {
                  if (
                    isOutsideMenuEvent(
                      {
                        currentTarget: event.currentTarget,
                        relatedTarget: event.relatedTarget as HTMLElement | null,
                      },
                      {
                        popupElement: popupElement(),
                        rootRef: refs.rootRef,
                        tree,
                        virtualFloatingTree: floatingRootContext()?.dataRef.virtualFloatingTree,
                        nodeId: nodeId?.(),
                      },
                    )
                  ) {
                    setValue(null, event, undefined);
                  }
                },
              },
              elementProps,
            ],
          }}
        />
      )}
    />
  );
}

export namespace NavigationMenuLink {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'a', State> {}
}
