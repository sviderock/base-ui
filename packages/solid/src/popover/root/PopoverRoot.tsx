'use client';
import { batch, createEffect, createSignal, onMount, Show, type JSX } from 'solid-js';
import {
  FloatingTree,
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  useRole,
} from '../../floating-ui-solid';
import { mergeProps } from '../../merge-props';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { translateOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useControlled } from '../../utils/useControlled';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { useScrollLock } from '../../utils/useScrollLock';
import { useTimeout } from '../../utils/useTimeout';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { OPEN_DELAY } from '../utils/constants';
import {
  PopoverOpenChangeReason,
  PopoverRootContext,
  usePopoverRootContext,
} from './PopoverRootContext';

function PopoverRootComponent(props: PopoverRoot.Props) {
  const externalOpen = () => access(props.open);
  const defaultOpen = () => access(props.defaultOpen) ?? false;
  const delay = () => access(props.delay) ?? OPEN_DELAY;
  const closeDelay = () => access(props.closeDelay) ?? 0;
  const openOnHover = () => access(props.openOnHover) ?? false;
  const modal = () => access(props.modal) ?? false;
  const actionsRef = () => access(props.actionsRef);

  const [instantType, setInstantType] = createSignal<'dismiss' | 'click'>();
  const [titleId, setTitleId] = createSignal<string>();
  const [descriptionId, setDescriptionId] = createSignal<string>();
  const [triggerElement, setTriggerElement] = createSignal<Element | null | undefined>(null);
  const [positionerElement, setPositionerElement] = createSignal<HTMLElement | null | undefined>(
    null,
  );
  const [openReason, setOpenReason] = createSignal<PopoverOpenChangeReason | null>(null);
  const [stickIfOpen, setStickIfOpen] = createSignal(true);

  const refs: PopoverRootContext['refs'] = {
    popupRef: null,
  };
  const stickIfOpenTimeout = useTimeout();

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'Popover',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  useScrollLock({
    enabled: () => open() && modal() === true && openReason() !== 'trigger-hover',
    mounted,
    open,
    referenceElement: positionerElement,
  });

  const handleUnmount = () => {
    batch(() => {
      setMounted(false);
      setStickIfOpen(true);
      setOpenReason(null);
      props.onOpenChangeComplete?.(false);
    });
  };

  useOpenChangeComplete({
    enabled: () => !actionsRef(),
    open,
    ref: () => refs.popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  onMount(() => {
    if (actionsRef()) {
      actionsRef()!.unmount = handleUnmount;
    }
  });

  createEffect(() => {
    if (!open()) {
      stickIfOpenTimeout.clear();
    }
  });

  const setOpen = (
    nextOpen: boolean,
    event: Event | undefined,
    reason: PopoverOpenChangeReason | undefined,
  ) => {
    const isHover = reason === 'trigger-hover';
    const isKeyboardClick = reason === 'trigger-press' && (event as MouseEvent).detail === 0;
    const isDismissClose = !nextOpen && (reason === 'escape-key' || reason == null);

    function changeState() {
      props.onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);

      if (nextOpen) {
        setOpenReason(reason ?? null);
      }
    }

    if (isHover) {
      // Only allow "patient" clicks to close the popover if it's open.
      // If they clicked within 500ms of the popover opening, keep it open.
      setStickIfOpen(true);
      stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        setStickIfOpen(false);
      });

      changeState();
    } else {
      changeState();
    }

    if (isKeyboardClick || isDismissClose) {
      setInstantType(isKeyboardClick ? 'click' : 'dismiss');
    } else {
      setInstantType(undefined);
    }
  };

  const floatingContext = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
  });

  const { openMethod, triggerProps } = useOpenInteractionType(open);

  const computedRestMs = () => delay();

  const hover = useHover(floatingContext, {
    enabled: () => openOnHover() && (openMethod() !== 'touch' || openReason() !== 'trigger-press'),
    mouseOnly: true,
    move: false,
    handleClose: safePolygon({ blockPointerEvents: true }),
    restMs: computedRestMs,
    delay: () => ({ close: closeDelay() }),
  });
  const click = useClick(floatingContext, {
    stickIfOpen,
  });
  const dismiss = useDismiss(floatingContext);
  const role = useRole(floatingContext);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss, role]);

  const popoverContext: PopoverRootContext = {
    open,
    setOpen,
    mounted,
    setMounted,
    transitionStatus,
    triggerElement,
    setTriggerElement,
    positionerElement,
    setPositionerElement,
    refs,
    titleId,
    setTitleId,
    descriptionId,
    setDescriptionId,
    triggerProps: () => mergeProps(getReferenceProps(), triggerProps),
    popupProps: () => getFloatingProps(),
    floatingRootContext: floatingContext,
    instantType,
    openMethod,
    openReason,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
    openOnHover,
    delay,
    closeDelay,
    modal,
  };

  return (
    <PopoverRootContext.Provider value={popoverContext}>
      {props.children}
    </PopoverRootContext.Provider>
  );
}

/**
 * Groups all parts of the popover.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverRoot(props: PopoverRoot.Props) {
  return (
    <Show
      when={usePopoverRootContext(true)}
      fallback={
        <FloatingTree>
          <PopoverRootComponent {...props} />
        </FloatingTree>
      }
    >
      <PopoverRootComponent {...props} />
    </Show>
  );
}

export namespace PopoverRoot {
  export interface State {}

  interface Parameters {
    /**
     * Whether the popover is initially open.
     *
     * To render a controlled popover, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the popover is currently open.
     */
    open?: MaybeAccessor<boolean | undefined>;
    /**
     * Event handler called when the popover is opened or closed.
     * @type (open: boolean, event?: Event, reason?: Popover.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: PopoverOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the popover is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the popover should also open when the trigger is hovered.
     * @default false
     */
    openOnHover?: MaybeAccessor<boolean | undefined>;
    /**
     * How long to wait before the popover may be opened on hover. Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 300
     */
    delay?: MaybeAccessor<number | undefined>;
    /**
     * How long to wait before closing the popover that was opened on hover.
     * Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 0
     */
    closeDelay?: MaybeAccessor<number | undefined>;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the popover will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the popover manually.
     * Useful when the popover's animation is controlled by an external library.
     */
    actionsRef?: MaybeAccessor<Actions | undefined>;
    /**
     * Determines if the popover enters a modal state when open.
     * - `true`: user interaction is limited to the popover: document page scroll is locked, and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * - `'trap-focus'`: focus is trapped inside the popover, but document page scroll is not locked and pointer interactions outside of it remain enabled.
     * @default false
     */
    modal?: MaybeAccessor<boolean | 'trap-focus' | undefined>;
  }

  export interface Props extends Parameters {
    children?: JSX.Element;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = PopoverOpenChangeReason;
}
