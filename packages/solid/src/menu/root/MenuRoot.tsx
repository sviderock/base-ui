'use client';
import { batch, createEffect, createMemo, createSignal, onMount, Show, type JSX } from 'solid-js';
import {
  ContextMenuRootContext,
  useContextMenuRootContext,
} from '../../context-menu/root/ContextMenuRootContext';
import { useDirection } from '../../direction-provider/DirectionContext';
import {
  FloatingTree,
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useHover,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '../../floating-ui-solid';
import { MenubarContext, useMenubarContext } from '../../menubar/MenubarContext';
import { mergeProps } from '../../merge-props';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { PATIENT_CLICK_THRESHOLD, TYPEAHEAD_RESET_MS } from '../../utils/constants';
import {
  translateOpenChangeReason,
  type BaseOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useControlled } from '../../utils/useControlled';
import { useId } from '../../utils/useId';
import { useMixedToggleClickHandler } from '../../utils/useMixedToggleClickHander';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useScrollLock } from '../../utils/useScrollLock';
import { useTimeout } from '../../utils/useTimeout';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';

const EMPTY_ARRAY: never[] = [];
const EMPTY_REF = false;

/**
 * Groups all parts of the menu.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuRoot(props: MenuRoot.Props) {
  const openProp = () => access(props.open);
  const defaultOpen = () => access(props.defaultOpen) ?? false;
  const disabled = () => access(props.disabled) ?? false;
  const modalProp = () => access(props.modal);
  const loop = () => access(props.loop) ?? true;
  const orientation = () => access(props.orientation) ?? 'vertical';
  const actionsRef = () => access(props.actionsRef);
  const openOnHoverProp = () => access(props.openOnHover);
  const delay = () => access(props.delay) ?? 100;
  const closeDelay = () => access(props.closeDelay) ?? 0;
  const closeParentOnEsc = () => access(props.closeParentOnEsc) ?? true;

  const [triggerElement, setTriggerElement] = createSignal<HTMLElement | null | undefined>(null);
  const [popupRef, setPopupRef] = createSignal<HTMLElement | null | undefined>(null);
  const [positionerRef, setPositionerElement] = createSignal<HTMLElement | null | undefined>(null);
  const [allowMouseUpTriggerRef, setAllowMouseUpTriggerRef] = createSignal(false);
  const [instantType, setInstantType] = createSignal<'dismiss' | 'click' | 'group'>();
  const [hoverEnabled, setHoverEnabled] = createSignal(true);
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const [lastOpenChangeReason, setLastOpenChangeReason] =
    createSignal<MenuRoot.OpenChangeReason | null>(null);
  const [stickIfOpen, setStickIfOpen] = createSignal(true);
  const [allowMouseEnterState, setAllowMouseEnterState] = createSignal(false);

  let openEventRef = null as Event | null;

  const stickIfOpenTimeout = useTimeout();
  const contextMenuContext = useContextMenuRootContext(true);
  const isSubmenu = useMenuSubmenuRootContext();

  const parentContext = useMenuRootContext(true);
  const menubarContext = useMenubarContext(true);

  const parent = createMemo<MenuParent>(() => {
    if (isSubmenu && parentContext) {
      return { type: 'menu', context: parentContext } as const;
    }

    if (menubarContext) {
      return { type: 'menubar', context: menubarContext } as const;
    }
    if (contextMenuContext) {
      return { type: 'context-menu', context: contextMenuContext } as const;
    }

    return { type: undefined };
  });

  const defaultRootId = useId();

  const rootId = createMemo(() => {
    const p = parent();
    if (p.type !== undefined) {
      return p.context.rootId();
    }
    return defaultRootId();
  });

  const modal = () =>
    (parent().type === undefined || parent().type === 'context-menu') && (modalProp() ?? true);

  // If this menu is a submenu, it should inherit `allowMouseEnter` from its
  // parent. Otherwise it manages the state on its own.
  const allowMouseEnter = () => {
    const p = parent();
    return p.type === 'menu' ? p.context.allowMouseEnter() : allowMouseEnterState();
  };

  const setAllowMouseEnter = (allowMouseEnter: boolean) => {
    const p = parent();
    return p.type === 'menu'
      ? p.context.setAllowMouseEnter(allowMouseEnter)
      : setAllowMouseEnterState(allowMouseEnter);
  };

  if (process.env.NODE_ENV !== 'production') {
    if (parent().type !== undefined && modalProp() !== undefined) {
      console.warn(
        'Base UI: The `modal` prop is not supported on nested menus. It will be ignored.',
      );
    }
  }

  const openOnHover = () => {
    const p = parent();
    return (
      openOnHoverProp() ??
      (p.type === 'menu' || (p.type === 'menubar' && p.context.hasSubmenuOpen()))
    );
  };

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'MenuRoot',
    state: 'open',
  });

  // eslint-disable-next-line solid/reactivity
  let allowOutsidePressDismissalRef = parent().type !== 'context-menu';
  const allowOutsidePressDismissalTimeout = useTimeout();

  createEffect(() => {
    if (!open()) {
      openEventRef = null;
    }

    if (parent().type !== 'context-menu') {
      return;
    }

    if (!open()) {
      allowOutsidePressDismissalTimeout.clear();
      allowOutsidePressDismissalRef = false;
      return;
    }

    // With `mousedown` outside press events and long press touch input, there
    // needs to be a grace period after opening to ensure the dismissal event
    // doesn't fire immediately after open.
    allowOutsidePressDismissalTimeout.start(500, () => {
      allowOutsidePressDismissalRef = true;
    });
  });

  const [transitionStatus, setTransitionStatus] = useTransitionStatus(open);

  useScrollLock({
    enabled: () => open() && modal() && lastOpenChangeReason() !== 'trigger-hover',
    mounted: () => transitionStatus.mounted,
    open,
    referenceElement: positionerRef,
  });

  createEffect(() => {
    if (!open() && !hoverEnabled()) {
      setHoverEnabled(true);
    }
  });

  const handleUnmount = () => {
    batch(() => {
      setTransitionStatus('mounted', false);
      setStickIfOpen(true);
      setAllowMouseEnter(false);
      props.onOpenChangeComplete?.(false);
    });
  };

  useOpenChangeComplete({
    enabled: () => !actionsRef(),
    open,
    ref: popupRef,
    onComplete() {
      if (!open()) {
        handleUnmount();
      }
    },
  });

  let allowTouchToCloseRef = true;
  const allowTouchToCloseTimeout = useTimeout();

  const setOpen = (
    nextOpen: boolean,
    event: Event | undefined,
    reason: MenuRoot.OpenChangeReason | undefined,
  ) => {
    if (open() === nextOpen) {
      return;
    }

    if (
      nextOpen === false &&
      event?.type === 'click' &&
      (event as PointerEvent).pointerType === 'touch' &&
      !allowTouchToCloseRef
    ) {
      return;
    }

    // Prevent the menu from closing on mobile devices that have a delayed click event.
    // In some cases the menu, when tapped, will fire the focus event first and then the click event.
    // Without this guard, the menu will close immediately after opening.
    if (nextOpen && reason === 'trigger-focus') {
      allowTouchToCloseRef = false;
      allowTouchToCloseTimeout.start(300, () => {
        allowTouchToCloseRef = true;
      });
    } else {
      allowTouchToCloseRef = true;
      allowTouchToCloseTimeout.clear();
    }

    const isKeyboardClick =
      (reason === 'trigger-press' || reason === 'item-press') &&
      (event as MouseEvent).detail === 0 &&
      event?.isTrusted;
    const isDismissClose = !nextOpen && (reason === 'escape-key' || reason == null);

    function changeState() {
      batch(() => {
        props.onOpenChange?.(nextOpen, event, reason);
        setOpenUnwrapped(nextOpen);
        setLastOpenChangeReason(reason ?? null);
        openEventRef = event ?? null;
      });
    }

    if (reason === 'trigger-hover') {
      // Only allow "patient" clicks to close the menu if it's open.
      // If they clicked within 500ms of the menu opening, keep it open.
      setStickIfOpen(true);
      stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        setStickIfOpen(false);
      });

      changeState();
    } else {
      changeState();
    }

    if (
      parent().type === 'menubar' &&
      (reason === 'trigger-focus' ||
        reason === 'focus-out' ||
        reason === 'trigger-hover' ||
        reason === 'list-navigation' ||
        reason === 'sibling-open')
    ) {
      setInstantType('group');
    } else if (isKeyboardClick || isDismissClose) {
      setInstantType(isKeyboardClick ? 'click' : 'dismiss');
    } else {
      setInstantType(undefined);
    }
  };

  const ctx = createMemo<ContextMenuRootContext | undefined>(() => {
    const pt = parent();
    return pt.type === 'context-menu' ? pt.context : undefined;
  });

  onMount(() => {
    if (actionsRef()) {
      actionsRef()!.unmount = handleUnmount;
    }

    if (ctx()) {
      ctx()!.refs.positionerRef = positionerRef();
      ctx()!.refs.actionsRef = { setOpen };
    }
  });

  createEffect(() => {
    if (!open()) {
      stickIfOpenTimeout.clear();
    }
  });

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerRef,
    },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
  });

  const hover = useHover(floatingRootContext, {
    enabled: () => {
      const p = parent();
      return (
        hoverEnabled() &&
        openOnHover() &&
        !disabled() &&
        p.type !== 'context-menu' &&
        (p.type !== 'menubar' || (p.context.hasSubmenuOpen() && !open()))
      );
    },
    handleClose: safePolygon({ blockPointerEvents: true }),
    mouseOnly: true,
    move: () => parent().type === 'menu',
    restMs: () => {
      const p = parent();
      return p.type === undefined || (p.type === 'menu' && allowMouseEnter()) ? delay() : undefined;
    },
    delay: () => {
      const p = parent();
      return p.type === 'menu'
        ? { open: allowMouseEnter() ? delay() : 10 ** 10, close: closeDelay() }
        : { close: closeDelay() };
    },
  });

  const focus = useFocus(floatingRootContext, {
    enabled: () => {
      const p = parent();
      return (
        !disabled() &&
        !open() &&
        p.type === 'menubar' &&
        p.context.hasSubmenuOpen() &&
        !contextMenuContext
      );
    },
  });

  const click = useClick(floatingRootContext, {
    enabled: () => !disabled() && parent().type !== 'context-menu',
    event: () => (open() && parent().type === 'menubar' ? 'click' : 'mousedown'),
    toggle: () => !openOnHover() || parent().type !== 'menu',
    ignoreMouse: () => openOnHover() && parent().type === 'menu',
    stickIfOpen: () => (parent().type === undefined ? stickIfOpen() : false),
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: () => !disabled(),
    bubbles: () => closeParentOnEsc() && parent().type === 'menu',
    outsidePressEvent: 'mousedown',
    outsidePress() {
      if (parent().type !== 'context-menu' || openEventRef?.type === 'contextmenu') {
        return true;
      }

      return allowOutsidePressDismissalRef;
    },
  });

  const role = useRole(floatingRootContext, {
    role: 'menu',
  });

  const itemDomElements: (HTMLElement | null | undefined)[] = [];
  const itemLabels: (string | null)[] = [];

  const direction = useDirection();

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: () => !disabled(),
    listRef: itemDomElements,
    activeIndex,
    nested: () => parent().type !== undefined,
    loop,
    orientation,
    parentOrientation: () => {
      const p = parent();
      return p.type === 'menubar' ? p.context.orientation() : undefined;
    },
    rtl: () => direction() === 'rtl',
    disabledIndices: EMPTY_ARRAY,
    onNavigate: setActiveIndex,
    openOnArrowKeyDown: () => parent().type !== 'context-menu',
  });

  let typingRef = false;

  const onTypingChange = (nextTyping: boolean) => {
    typingRef = nextTyping;
  };

  const typeahead = useTypeahead(floatingRootContext, {
    listRef: () => itemLabels,
    activeIndex,
    resetMs: TYPEAHEAD_RESET_MS,
    onMatch: (index) => {
      if (open() && index !== activeIndex()) {
        setActiveIndex(index);
      }
    },
    onTypingChange,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    hover,
    click,
    dismiss,
    focus,
    role,
    listNavigation,
    typeahead,
  ]);

  const mixedToggleHandlers = useMixedToggleClickHandler({
    open,
    enabled: () => parent().type === 'menubar',
    mouseDownAction: 'open',
  });

  const triggerProps = createMemo(() => {
    const referenceProps = mergeProps(
      getReferenceProps(),
      {
        onMouseEnter() {
          setHoverEnabled(true);
        },
        onMouseMove() {
          setAllowMouseEnter(true);
        },
      },
      mixedToggleHandlers(),
    );
    delete referenceProps.role;
    return referenceProps;
  });

  const popupProps = createMemo(() =>
    getFloatingProps({
      onMouseEnter() {
        if (!openOnHover() || parent().type === 'menu') {
          setHoverEnabled(false);
        }
      },
      onMouseMove() {
        setAllowMouseEnter(true);
      },
      onClick() {
        if (openOnHover()) {
          setHoverEnabled(false);
        }
      },
    }),
  );

  createEffect(() => {
    const p = parent();
    setAllowMouseUpTriggerRef(
      p.type ? (p.context as MenubarContext).allowMouseUpTriggerRef : EMPTY_REF,
    );
  });

  const itemProps = createMemo(() => getItemProps());

  const context: MenuRootContext = {
    activeIndex,
    setActiveIndex,
    floatingRootContext,
    itemProps,
    popupProps,
    triggerProps,
    itemDomElements,
    itemLabels,
    mounted: () => transitionStatus.mounted,
    open,
    popupRef,
    setPopupRef,
    setOpen,
    positionerRef,
    setPositionerElement,
    allowMouseUpTriggerRef,
    setAllowMouseUpTriggerRef,
    triggerElement,
    setTriggerElement,
    transitionStatus: () => transitionStatus.transitionStatus,
    lastOpenChangeReason,
    instantType,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
    setHoverEnabled,
    typingRef: () => typingRef,
    modal,
    disabled,
    // eslint-disable-next-line solid/reactivity
    parent: parent(),
    rootId,
    allowMouseEnter,
    setAllowMouseEnter,
  };

  return (
    <Show
      when={parent().type === undefined || parent().type === 'context-menu'}
      fallback={
        <MenuRootContext.Provider value={context}>{props.children}</MenuRootContext.Provider>
      }
    >
      <FloatingTree>
        <MenuRootContext.Provider value={context}>{props.children}</MenuRootContext.Provider>
      </FloatingTree>
    </Show>
  );
}

export namespace MenuRoot {
  export interface Props {
    children: JSX.Element;
    /**
     * Whether the menu is initially open.
     *
     * To render a controlled menu, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: MaybeAccessor<boolean | undefined>;
    /**
     * Determines if the menu enters a modal state when open.
     * - `true`: user interaction is limited to the menu: document page scroll is locked and and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * @default true
     */
    modal?: MaybeAccessor<boolean | undefined>;
    /**
     * Event handler called when the menu is opened or closed.
     * @type (open: boolean, event?: Event, reason?: Menu.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the menu is closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the menu is currently open.
     */
    open?: MaybeAccessor<boolean | undefined>;
    /**
     * The visual orientation of the menu.
     * Controls whether roving focus uses up/down or left/right arrow keys.
     * @default 'vertical'
     */
    orientation?: MaybeAccessor<Orientation | undefined>;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * When in a submenu, determines whether pressing the Escape key
     * closes the entire menu, or only the current child menu.
     * @default true
     */
    closeParentOnEsc?: MaybeAccessor<boolean | undefined>;
    /**
     * How long to wait before the menu may be opened on hover. Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 100
     */
    delay?: MaybeAccessor<number | undefined>;
    /**
     * How long to wait before closing the menu that was opened on hover.
     * Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 0
     */
    closeDelay?: MaybeAccessor<number | undefined>;
    /**
     * Whether the menu should also open when the trigger is hovered.
     */
    openOnHover?: MaybeAccessor<boolean | undefined>;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the menu will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the menu manually.
     * Useful when the menu's animation is controlled by an external library.
     */
    actionsRef?: MaybeAccessor<Actions | undefined>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = BaseOpenChangeReason | 'sibling-open';

  export type Orientation = 'horizontal' | 'vertical';

  export interface Actions {
    unmount: () => void;
  }
}

export type MenuParent =
  | {
      type: 'menu';
      context: MenuRootContext;
    }
  | {
      type: 'menubar';
      context: MenubarContext;
    }
  | {
      type: 'context-menu';
      context: ContextMenuRootContext;
    }
  | {
      type: 'nested-context-menu';
      context: ContextMenuRootContext;
      menuContext: MenuRootContext;
    }
  | {
      type: undefined;
    };
