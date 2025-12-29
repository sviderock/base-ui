'use client';
import { createEffect, createMemo, onCleanup, type JSX } from 'solid-js';
import { useDirection } from '../../direction-provider/DirectionContext';
import {
  getNextTabbable,
  getPreviousTabbable,
  isOutsideEvent,
} from '../../floating-ui-solid/utils';
import { splitComponentProps } from '../../solid-helpers';
import { FocusGuard } from '../../utils/FocusGuard';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useNavigationMenuPositionerContext } from '../positioner/NavigationMenuPositionerContext';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';

const customStyleHookMapping: CustomStyleHookMapping<NavigationMenuPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the navigation menu contents.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuPopup(componentProps: NavigationMenuPopup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['id']);

  const { open, transitionStatus, popupElement, positionerElement, setPopupElement, refs } =
    useNavigationMenuRootContext();
  const positioning = useNavigationMenuPositionerContext();
  const direction = useDirection();

  const id = useBaseUiId(() => local.id);

  const state: NavigationMenuPopup.State = {
    get open() {
      return open();
    },
    get transitionStatus() {
      return transitionStatus();
    },
    get side() {
      return positioning.side();
    },
    get align() {
      return positioning.align();
    },
    get anchorHidden() {
      return positioning.anchorHidden();
    },
  };

  // Allow the arrow to transition while the popup's size transitions.
  createEffect(() => {
    const popupEl = popupElement();
    if (!popupEl || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(positioning.update);
    observer.observe(popupEl);
    onCleanup(() => {
      observer.disconnect();
    });
  });

  // Ensure popup size transitions correctly when anchored to `bottom` (side=top) or `right` (side=left).
  // TODO: this breaks the repositioning due to synchronious change of positioning.side(). Do not use for now.
  const calculatedStyles = createMemo(() => {
    const side = positioning.side();
    const dir = direction();

    let isOriginSide = side === 'top';
    let isPhysicalLeft = side === 'left';
    if (dir === 'rtl') {
      isOriginSide = isOriginSide || side === 'inline-end';
      isPhysicalLeft = isPhysicalLeft || side === 'inline-end';
    } else {
      isOriginSide = isOriginSide || side === 'inline-start';
      isPhysicalLeft = isPhysicalLeft || side === 'inline-start';
    }

    return { isOriginSide, isPhysicalLeft };
  });

  const element = useRenderElement('nav', componentProps, {
    state,
    ref: setPopupElement,
    props: [
      {
        get id() {
          return id();
        },
        tabIndex: -1,
        get style(): JSX.CSSProperties | undefined {
          return calculatedStyles().isOriginSide
            ? {
                position: 'absolute',
                [calculatedStyles().isOriginSide ? 'bottom' : 'top']: '0',
                [calculatedStyles().isPhysicalLeft ? 'right' : 'left']: '0',
              }
            : undefined;
        },
      },
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <>
      <FocusGuard
        ref={(el) => {
          refs.beforeInsideRef = el;
        }}
        onFocus={(event) => {
          const positionerEl = positionerElement();
          if (positionerEl && isOutsideEvent(event, positionerEl)) {
            queueMicrotask(() => {
              getNextTabbable(positionerEl)?.focus();
            });
          } else {
            queueMicrotask(() => {
              refs.beforeOutsideRef?.focus();
            });
          }
        }}
      />
      {element()}
      <FocusGuard
        ref={(el) => {
          refs.afterInsideRef = el;
        }}
        onFocus={(event) => {
          const positionerEl = positionerElement();
          if (positionerEl && isOutsideEvent(event, positionerEl)) {
            queueMicrotask(() => {
              getPreviousTabbable(positionerEl)?.focus();
            });
          } else {
            queueMicrotask(() => {
              refs.afterOutsideRef?.focus();
            });
          }
        }}
      />
    </>
  );
}

export namespace NavigationMenuPopup {
  export interface State {
    /**
     * If `true`, the popup is open.
     */
    open: boolean;
    /**
     * The transition status of the popup.
     */
    transitionStatus: TransitionStatus;
    /**
     * The side of the anchor element the popup is positioned relative to.
     */
    side: Side;
    /**
     * How to align the popup relative to the specified side.
     */
    align: Align;
    /**
     * If `true`, the anchor is hidden.
     */
    anchorHidden: boolean;
  }

  export interface Props extends BaseUIComponentProps<'nav', State> {}
}
