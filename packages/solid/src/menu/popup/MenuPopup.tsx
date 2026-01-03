import { createMemo, onCleanup, onMount, type JSX } from 'solid-js';
import { FloatingFocusManager, useFloatingTree } from '../../floating-ui-solid';
import { splitComponentProps } from '../../solid-helpers';
import { DISABLED_TRANSITIONS_STYLE } from '../../utils/constants';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side } from '../../utils/useAnchorPositioning';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
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

  const state: MenuPopup.State = {
    get transitionStatus() {
      return transitionStatus();
    },
    get side() {
      return side();
    },
    get align() {
      return align();
    },
    get open() {
      return open();
    },
    get nested() {
      return parent().type === 'menu';
    },
    get instant() {
      return instantType();
    },
  };

  const returnFocus = createMemo(() => {
    if (parent().type === 'menubar' && lastOpenChangeReason() !== 'outside-press') {
      return true;
    }
    return parent().type === undefined || parent().type === 'context-menu';
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setPopupRef,
    customStyleHookMapping,
    props: [
      popupProps,
      {
        get style() {
          return transitionStatus() === 'starting' ? DISABLED_TRANSITIONS_STYLE.style : undefined;
        },
      },
      elementProps,
      {
        get ['data-rootownerid' as string]() {
          return rootId();
        },
      },
    ],
  });

  return (
    <FloatingFocusManager
      context={floatingContext}
      modal={false}
      disabled={!mounted()}
      returnFocus={local.finalFocus || returnFocus()}
      initialFocus={parent().type === 'menu' ? -1 : 0}
      restoreFocus
    >
      {element()}
    </FloatingFocusManager>
  );
}

export namespace MenuPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: JSX.Element;
    /**
     * Determines the element to focus when the menu is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: HTMLElement | null | undefined;
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
