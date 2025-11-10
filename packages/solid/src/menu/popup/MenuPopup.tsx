'use client';
import { createMemo, onCleanup, onMount, type JSX } from 'solid-js';
import { FloatingFocusManager, useFloatingTree } from '../../floating-ui-solid';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side } from '../../utils/useAnchorPositioning';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { RenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import type { MenuRoot } from '../root/MenuRoot';
import { useMenuRootContext, type InstantType } from '../root/MenuRootContext';

const customStyleHookMapping: CustomStyleHookMapping<MenuPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuPopup(componentProps: MenuPopup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['finalFocus']);
  const finalFocus = () => access(local.finalFocus);

  const {
    open,
    setOpen,
    transitionStatus,
    popupProps,
    mounted,
    instantType,
    onOpenChangeComplete,
    parent,
    lastOpenChangeReason,
    rootId,
    popupRef,
    setPopupRef,
  } = useMenuRootContext();
  const { side, align, floatingContext } = useMenuPositionerContext();

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open()) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const { events: menuEvents } = useFloatingTree()!;

  function handleClose(event: {
    domEvent: Event | undefined;
    reason: MenuRoot.OpenChangeReason | undefined;
  }) {
    setOpen(false, event.domEvent, event.reason);
  }

  onMount(() => {
    menuEvents.on('close', handleClose);
    onCleanup(() => {
      menuEvents.off('close', handleClose);
    });
  });

  const state = createMemo<MenuPopup.State>(() => ({
    transitionStatus: transitionStatus(),
    side: side(),
    align: align(),
    open: open(),
    nested: parent().type === 'menu',
    instant: instantType(),
  }));

  const returnFocus = createMemo(() => {
    if (parent().type === 'menubar' && lastOpenChangeReason() !== 'outside-press') {
      return true;
    }
    return parent().type === undefined || parent().type === 'context-menu';
  });

  return (
    <FloatingFocusManager
      context={floatingContext()}
      modal={false}
      disabled={!mounted()}
      returnFocus={finalFocus() || returnFocus()}
      initialFocus={parent().type === 'menu' ? -1 : 0}
      restoreFocus
    >
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={(el) => {
          setPopupRef(el);
          if (typeof componentProps.ref === 'function') {
            componentProps.ref(el);
          } else {
            componentProps.ref = el;
          }
        }}
        params={{
          state: state(),
          customStyleHookMapping,
          props: [
            popupProps(),
            transitionStatus() === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
            elementProps,
            { 'data-rootownerid': rootId() } as Record<string, string>,
          ],
        }}
      />
    </FloatingFocusManager>
  );
}

export namespace MenuPopup {
  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
    children?: JSX.Element;
    /**
     * @ignore
     */
    id?: MaybeAccessor<string | undefined>;
    /**
     * Determines the element to focus when the menu is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: MaybeAccessor<HTMLElement | null | undefined>;
  }

  export type State = {
    transitionStatus: TransitionStatus;
    side: Side;
    align: 'start' | 'end' | 'center';
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
    nested: boolean;
    instant: InstantType | undefined;
  };
}
