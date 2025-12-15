'use client';
import { createMemo, createSignal, Show, type ComponentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import { FloatingNode } from '../../floating-ui-solid';
import { contains } from '../../floating-ui-solid/utils';
import { access, splitComponentProps } from '../../solid-helpers';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { inertValue } from '../../utils/inertValue';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { AnimationFrame } from '../../utils/useAnimationFrame';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { TransitionStatus } from '../../utils/useTransitionStatus';
import { useNavigationMenuItemContext } from '../item/NavigationMenuItemContext';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';

const customStyleHookMapping: CustomStyleHookMapping<NavigationMenuContent.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
  activationDirection(value) {
    const val = access(value);
    if (!val) {
      return null;
    }
    return {
      'data-activation-direction': val,
    };
  },
};

/**
 * A container for the content of the navigation menu item that is moved into the popup
 * when the item is active.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuContent(componentProps: NavigationMenuContent.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { viewportElement, activationDirection, refs } = useNavigationMenuRootContext();
  const { open, transitionStatus, mounted, setMounted } = useNavigationMenuItemContext();
  const nodeId = useNavigationMenuTreeContext();

  let ref = null as HTMLDivElement | null | undefined;

  const [focusInside, setFocusInside] = createSignal(false);

  useOpenChangeComplete({
    ref: () => ref,
    open,
    onComplete() {
      AnimationFrame.request(() => {
        if (!open()) {
          setMounted(false);
        }
      });
    },
  });

  const state = createMemo<NavigationMenuContent.State>(() => ({
    open: open(),
    transitionStatus: transitionStatus(),
    activationDirection: activationDirection(),
  }));

  const handleCurrentContentRef = (node: HTMLDivElement | null | undefined) => {
    if (node) {
      refs.currentContentRef = node;
    }
  };

  const commonProps: ComponentProps<'div'> = {
    onFocus() {
      setFocusInside(true);
    },
    onBlur(event) {
      if (!contains(event.currentTarget, event.relatedTarget as Element | null | undefined)) {
        setFocusInside(false);
      }
    },
  };

  const shouldRender = () => viewportElement() != null && mounted();

  const element = useRenderElement('div', componentProps, {
    enabled: shouldRender,
    state,
    ref: (el) => {
      ref = el;
      handleCurrentContentRef(el);
    },
    props: [
      () =>
        !open() && mounted()
          ? {
              style: { position: 'absolute', top: 0, left: 0 },
              inert: inertValue(!focusInside()),
              ...commonProps,
            }
          : commonProps,
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <Show when={shouldRender()}>
      <Portal mount={viewportElement()!}>
        <FloatingNode id={nodeId?.()}>
          <CompositeRoot stopEventPropagation render={element} />
        </FloatingNode>
      </Portal>
    </Show>
  );
}

export namespace NavigationMenuContent {
  export interface State {
    /**
     * If `true`, the component is open.
     */
    open: boolean;
    /**
     * The transition status of the component.
     */
    transitionStatus: TransitionStatus;
    /**
     * The direction of the activation.
     */
    activationDirection: 'left' | 'right' | 'up' | 'down' | null;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
