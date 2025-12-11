'use client';
import { getSide } from '@floating-ui/utils';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type ComponentProps,
  type JSX,
} from 'solid-js';
import type { Middleware } from '../../floating-ui-solid';
import {
  disableFocusInside,
  enableFocusInside,
  isOutsideEvent,
} from '../../floating-ui-solid/utils';
import { access, splitComponentProps } from '../../solid-helpers';
import { DROPDOWN_COLLISION_AVOIDANCE, POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';
import { ownerDocument } from '../../utils/owner';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useNavigationMenuPortalContext } from '../portal/NavigationMenuPortalContext';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { NavigationMenuPositionerContext } from './NavigationMenuPositionerContext';

const adaptiveOrigin: Middleware = {
  name: 'adaptiveOrigin',
  async fn(state) {
    const {
      x: rawX,
      y: rawY,
      rects: { floating: floatRect },
      elements: { floating },
      platform,
      strategy,
      placement,
    } = state;

    const win = floating.ownerDocument.defaultView;
    const offsetParent = await platform.getOffsetParent?.(floating);

    let offsetDimensions = { width: 0, height: 0 };

    // For fixed strategy, prefer visualViewport if available
    if (strategy === 'fixed' && win?.visualViewport) {
      offsetDimensions = {
        width: win.visualViewport.width,
        height: win.visualViewport.height,
      };
    } else if (offsetParent === win) {
      const doc = ownerDocument(floating);
      offsetDimensions = {
        width: doc.documentElement.clientWidth,
        height: doc.documentElement.clientHeight,
      };
    } else if (await platform.isElement?.(offsetParent)) {
      offsetDimensions = await platform.getDimensions(offsetParent);
    }

    const currentSide = getSide(placement);
    let x = rawX;
    let y = rawY;

    if (currentSide === 'left') {
      x = offsetDimensions.width - (rawX + floatRect.width);
    }
    if (currentSide === 'top') {
      y = offsetDimensions.height - (rawY + floatRect.height);
    }

    const sideX = currentSide === 'left' ? 'right' : 'left';
    const sideY = currentSide === 'top' ? 'bottom' : 'top';
    return {
      x,
      y,
      data: {
        sideX,
        sideY,
      },
    };
  },
};

/**
 * Positions the navigation menu against the currently active trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuPositioner(componentProps: NavigationMenuPositioner.Props) {
  const { open, mounted, setPositionerElement, floatingRootContext, nested } =
    useNavigationMenuRootContext();

  const [, local, elementProps] = splitComponentProps(componentProps, [
    'anchor',
    'positionMethod',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'collisionBoundary',
    'collisionPadding',
    'collisionAvoidance',
    'arrowPadding',
    'sticky',
    'trackAnchor',
  ]);

  const anchor = () => access(local.anchor);
  const positionMethod = () => access(local.positionMethod) ?? 'absolute';
  const side = () => access(local.side) ?? 'bottom';
  const align = () => access(local.align) ?? 'center';
  const sideOffset = () => access(local.sideOffset) ?? 0;
  const alignOffset = () => access(local.alignOffset) ?? 0;
  const collisionBoundary = () => access(local.collisionBoundary) ?? 'clipping-ancestors';
  const collisionPadding = () => access(local.collisionPadding) ?? 5;
  const collisionAvoidance = () =>
    access(local.collisionAvoidance) ??
    (nested() ? POPUP_COLLISION_AVOIDANCE : DROPDOWN_COLLISION_AVOIDANCE);
  const arrowPadding = () => access(local.arrowPadding) ?? 5;
  const sticky = () => access(local.sticky) ?? false;
  const trackAnchor = () => access(local.trackAnchor) ?? true;

  const keepMounted = useNavigationMenuPortalContext();
  const nodeId = useNavigationMenuTreeContext();

  const [instant, setInstant] = createSignal(true);

  let positionerRef = null as HTMLDivElement | null | undefined;
  let prevTriggerElementRef = null as Element | null | undefined;

  const runOnceAnimationsFinish = useAnimationsFinished(() => positionerRef);

  // When the current trigger element changes, enable transitions on the
  // positioner temporarily
  createEffect(() => {
    const currentTriggerElement = floatingRootContext()?.elements.domReference();

    if (currentTriggerElement) {
      prevTriggerElementRef = currentTriggerElement;
    }

    if (
      prevTriggerElementRef &&
      currentTriggerElement &&
      currentTriggerElement !== prevTriggerElementRef
    ) {
      setInstant(false);
      const ac = new AbortController();
      runOnceAnimationsFinish(() => {
        setInstant(true);
      }, ac.signal);
      onCleanup(() => {
        ac.abort();
      });
    }
  });

  const positioning = useAnchorPositioning({
    anchor: () =>
      anchor() ?? floatingRootContext()?.elements.domReference() ?? prevTriggerElementRef,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    trackAnchor,
    keepMounted,
    floatingRootContext,
    collisionAvoidance,
    nodeId,
    // Allows the menu to remain anchored without wobbling while its size
    // and position transition simultaneously when side=top or side=left.
    adaptiveOrigin,
  });

  const defaultProps = createMemo<ComponentProps<'div'>>(() => {
    const hiddenStyles: JSX.CSSProperties = {};

    if (!open()) {
      hiddenStyles['pointer-events'] = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted(),
      style: {
        ...positioning.positionerStyles(),
        ...hiddenStyles,
      },
    };
  });

  const state = createMemo<NavigationMenuPositioner.State>(() => ({
    open: open(),
    side: positioning.side(),
    align: positioning.align(),
    anchorHidden: positioning.anchorHidden(),
    instant: instant(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    customStyleHookMapping: popupStateMapping,
    ref: (el) => {
      setPositionerElement(el);
      positionerRef = el;
    },
    props: [
      defaultProps,
      // https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/TabbablePortal.tsx
      {
        'on:focusin': {
          capture: true,
          handleEvent: (event) => {
            if (positionerRef && isOutsideEvent(event)) {
              enableFocusInside(positionerRef);
            }
          },
        },
        'on:focusout': {
          capture: true,
          handleEvent: (event) => {
            if (positionerRef && isOutsideEvent(event)) {
              disableFocusInside(positionerRef);
            }
          },
        },
      },
      elementProps,
    ],
  });

  return (
    <NavigationMenuPositionerContext.Provider value={positioning}>
      {element()}
    </NavigationMenuPositionerContext.Provider>
  );
}

export namespace NavigationMenuPositioner {
  export interface State {
    /**
     * Whether the navigation menu is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
    /**
     * Whether CSS transitions should be disabled.
     */
    instant: boolean;
  }

  export interface Props
    extends useAnchorPositioning.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
