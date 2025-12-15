'use client';
import { createMemo, type JSX } from 'solid-js';
import { access, splitComponentProps } from '../../solid-helpers';
import { POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';
import { popupStateMapping } from '../../utils/popupStateMapping';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { type Align, type Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import { useRenderElement } from '../../utils/useRenderElement';
import { usePreviewCardPortalContext } from '../portal/PreviewCardPortalContext';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { PreviewCardPositionerContext } from './PreviewCardPositionerContext';

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardPositioner(componentProps: PreviewCardPositioner.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'anchor',
    'positionMethod',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'collisionBoundary',
    'collisionPadding',
    'arrowPadding',
    'sticky',
    'trackAnchor',
    'collisionAvoidance',
  ]);
  const anchor = () => access(local.anchor);
  const positionMethod = () => access(local.positionMethod) ?? 'absolute';
  const side = () => access(local.side) ?? 'bottom';
  const align = () => access(local.align) ?? 'center';
  const sideOffset = () => access(local.sideOffset) ?? 0;
  const alignOffset = () => access(local.alignOffset) ?? 0;
  const collisionBoundary = () => access(local.collisionBoundary) ?? 'clipping-ancestors';
  const collisionPadding = () => access(local.collisionPadding) ?? 5;
  const arrowPadding = () => access(local.arrowPadding) ?? 5;
  const sticky = () => access(local.sticky) ?? false;
  const trackAnchor = () => access(local.trackAnchor) ?? true;
  const collisionAvoidance = () => access(local.collisionAvoidance) ?? POPUP_COLLISION_AVOIDANCE;

  const { open, mounted, floatingRootContext, setPositionerElement } = usePreviewCardRootContext();
  const keepMounted = usePreviewCardPortalContext();

  const positioning = useAnchorPositioning({
    anchor,
    floatingRootContext,
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
    collisionAvoidance,
  });

  const defaultProps = createMemo<HTMLProps>(() => {
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

  const state = createMemo<PreviewCardPositioner.State>(() => ({
    open: open(),
    side: positioning.side(),
    align: positioning.align(),
    anchorHidden: positioning.anchorHidden(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setPositionerElement,
    props: [defaultProps, elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <PreviewCardPositionerContext.Provider value={positioning}>
      {element()}
    </PreviewCardPositionerContext.Provider>
  );
}

export namespace PreviewCardPositioner {
  export interface State {
    /**
     * Whether the preview card is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends useAnchorPositioning.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
