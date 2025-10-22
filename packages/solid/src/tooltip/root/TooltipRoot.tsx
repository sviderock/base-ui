'use client';
import { batch, createEffect, createSignal, onMount, type JSX } from 'solid-js';
import {
  safePolygon,
  useClientPoint,
  useDelayGroup,
  useDismiss,
  useFloatingRootContext,
  useFocus,
  useHover,
  useInteractions,
} from '../../floating-ui-solid';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { translateOpenChangeReason } from '../../utils/translateOpenChangeReason';
import { useControlled } from '../../utils/useControlled';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useTooltipProviderContext } from '../provider/TooltipProviderContext';
import { OPEN_DELAY } from '../utils/constants';
import { TooltipOpenChangeReason, TooltipRootContext } from './TooltipRootContext';

/**
 * Groups all parts of the tooltip.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export function TooltipRoot(props: TooltipRoot.Props) {
  const disabled = () => access(props.disabled) ?? false;
  const defaultOpen = () => access(props.defaultOpen) ?? false;
  const open = () => access(props.open);
  const delay = () => access(props.delay);
  const closeDelay = () => access(props.closeDelay);
  const hoverable = () => access(props.hoverable) ?? true;
  const trackCursorAxis = () => access(props.trackCursorAxis) ?? 'none';
  const actionsRef = () => access(props.actionsRef);

  const delayWithDefault = () => delay() ?? OPEN_DELAY;
  const closeDelayWithDefault = () => closeDelay() ?? 0;

  const [triggerElement, setTriggerElement] = createSignal<Element | null | undefined>(null);
  const [positionerElement, setPositionerElement] = createSignal<HTMLElement | null | undefined>(
    null,
  );
  const [instantTypeState, setInstantTypeState] = createSignal<'dismiss' | 'focus'>();

  const refs: TooltipRootContext['refs'] = {
    popupRef: null,
  };

  const [openState, setOpenUnwrapped] = useControlled({
    controlled: open,
    default: defaultOpen,
    name: 'Tooltip',
    state: 'open',
  });

  const setOpen = (
    nextOpen: boolean,
    event: Event | undefined,
    reason: TooltipOpenChangeReason | undefined,
  ) => {
    const isHover = reason === 'trigger-hover';
    const isFocusOpen = nextOpen && reason === 'trigger-focus';
    const isDismissClose = !nextOpen && (reason === 'trigger-press' || reason === 'escape-key');

    function changeState() {
      batch(() => {
        props.onOpenChange?.(nextOpen, event, reason);
        setOpenUnwrapped(nextOpen);
      });
    }

    if (isHover) {
      // If a hover reason is provided, we need to flush the state synchronously. This ensures
      // `node.getAnimations()` knows about the new state.
      changeState();
    } else {
      changeState();
    }

    if (isFocusOpen || isDismissClose) {
      setInstantTypeState(isFocusOpen ? 'focus' : 'dismiss');
    } else if (reason === 'trigger-hover') {
      setInstantTypeState(undefined);
    }
  };

  createEffect(() => {
    if (openState() && disabled()) {
      setOpen(false, undefined, 'disabled');
    }
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(openState);

  const handleUnmount = () => {
    batch(() => {
      setMounted(false);
      props.onOpenChangeComplete?.(false);
    });
  };

  useOpenChangeComplete({
    enabled: () => !actionsRef(),
    open: openState,
    ref: () => refs.popupRef,
    onComplete() {
      if (!openState()) {
        handleUnmount();
      }
    },
  });

  onMount(() => {
    if (actionsRef()) {
      actionsRef()!.unmount = handleUnmount;
    }
  });

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open: openState,
    onOpenChange(openValue, eventValue, reasonValue) {
      setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
  });

  const providerContext = useTooltipProviderContext();
  const { delayRef, isInstantPhase, hasProvider } = useDelayGroup(floatingRootContext);

  const instantType = () => (isInstantPhase() ? ('delay' as const) : instantTypeState());

  const hover = useHover(floatingRootContext, {
    enabled: () => !disabled(),
    mouseOnly: true,
    move: false,
    handleClose: (context) => {
      if (hoverable() && trackCursorAxis() !== 'both') {
        return safePolygon()(context);
      }
      return () => undefined;
    },
    restMs() {
      const providerDelay = providerContext?.delay();
      const delayRefValue = delayRef();
      const groupOpenValue = typeof delayRefValue === 'object' ? delayRefValue.open : undefined;

      let computedRestMs = delayWithDefault();
      if (hasProvider()) {
        if (groupOpenValue !== 0) {
          computedRestMs = delay() ?? providerDelay ?? delayWithDefault();
        } else {
          computedRestMs = 0;
        }
      }

      return computedRestMs;
    },
    delay() {
      const delayRefValue = delayRef();
      const closeValue = typeof delayRefValue === 'object' ? delayRefValue.close : undefined;

      let computedCloseDelay: number | undefined = closeDelayWithDefault();
      if (closeDelay() == null && hasProvider()) {
        computedCloseDelay = closeValue;
      }

      return {
        close: computedCloseDelay,
      };
    },
  });

  const focus = useFocus(floatingRootContext, { enabled: () => !disabled() });
  const dismiss = useDismiss(floatingRootContext, {
    enabled: () => !disabled(),
    referencePress: true,
  });
  const clientPoint = useClientPoint(floatingRootContext, {
    enabled: () => !disabled() && trackCursorAxis() !== 'none',
    axis: () => {
      const axis = trackCursorAxis();
      return axis === 'none' ? undefined : axis;
    },
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    clientPoint,
  ]);

  const tooltipRoot = {
    open: openState,
    setOpen,
    mounted,
    setMounted,
    setTriggerElement,
    positionerElement,
    setPositionerElement,
    refs,
    triggerProps: () => getReferenceProps(),
    popupProps: () => getFloatingProps(),
    floatingRootContext,
    instantType,
    transitionStatus,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
  };

  const contextValue: TooltipRootContext = {
    ...tooltipRoot,
    delay: delayWithDefault,
    closeDelay: closeDelayWithDefault,
    trackCursorAxis,
    hoverable,
  };

  return (
    <TooltipRootContext.Provider value={contextValue}>{props.children}</TooltipRootContext.Provider>
  );
}

export namespace TooltipRoot {
  export interface State {}

  export interface Props {
    children?: JSX.Element;
    /**
     * Whether the tooltip is initially open.
     *
     * To render a controlled tooltip, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the tooltip is currently open.
     */
    open?: MaybeAccessor<boolean | undefined>;
    /**
     * Event handler called when the tooltip is opened or closed.
     * @type (open: boolean, event?: Event, reason?: Tooltip.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: TooltipOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the tooltip is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the tooltip contents can be hovered without closing the tooltip.
     * @default true
     */
    hoverable?: MaybeAccessor<boolean | undefined>;
    /**
     * Determines which axis the tooltip should track the cursor on.
     * @default 'none'
     */
    trackCursorAxis?: MaybeAccessor<'none' | 'x' | 'y' | 'both'>;
    /**
     * How long to wait before opening the tooltip. Specified in milliseconds.
     * @default 600
     */
    delay?: MaybeAccessor<number | undefined>;
    /**
     * How long to wait before closing the tooltip. Specified in milliseconds.
     * @default 0
     */
    closeDelay?: MaybeAccessor<number | undefined>;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the tooltip will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the tooltip manually.
     * Useful when the tooltip's animation is controlled by an external library.
     */
    actionsRef?: MaybeAccessor<Actions | undefined>;
    /**
     * Whether the tooltip is disabled.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = TooltipOpenChangeReason;
}
