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
import { mergeProps } from '../../merge-props/mergeProps';
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
  const disabled = () => props.disabled ?? false;
  const defaultOpen = () => props.defaultOpen ?? false;
  const hoverable = () => props.hoverable ?? true;
  const trackCursorAxis = () => props.trackCursorAxis ?? 'none';
  const delayWithDefault = () => props.delay ?? OPEN_DELAY;
  const closeDelayWithDefault = () => props.closeDelay ?? 0;

  const [triggerElement, setTriggerElement] = createSignal<Element | null | undefined>(null);
  const [positionerElement, setPositionerElement] = createSignal<HTMLElement | null | undefined>(
    null,
  );
  const [instantTypeState, setInstantTypeState] = createSignal<'dismiss' | 'focus'>();

  const refs: TooltipRootContext['refs'] = {
    popupRef: null,
  };

  const [openState, setOpenUnwrapped] = useControlled({
    controlled: () => props.open,
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
    enabled: () => !props.actionsRef,
    open: openState,
    ref: () => refs.popupRef,
    onComplete() {
      if (!openState()) {
        handleUnmount();
      }
    },
  });

  onMount(() => {
    if (props.actionsRef) {
      props.actionsRef.unmount = handleUnmount;
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
          computedRestMs = props.delay ?? providerDelay ?? delayWithDefault();
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
      if (props.closeDelay == null && hasProvider()) {
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

  const contextValue: TooltipRootContext = {
    open: openState,
    setOpen,
    mounted,
    setMounted,
    setTriggerElement,
    positionerElement,
    setPositionerElement,
    refs,
    triggerProps: (externalProps) => mergeProps(externalProps, getReferenceProps()),
    popupProps: (externalProps) => mergeProps(externalProps, getFloatingProps()),
    floatingRootContext,
    instantType,
    transitionStatus,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
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
    defaultOpen?: boolean;
    /**
     * Whether the tooltip is currently open.
     */
    open?: boolean;
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
    hoverable?: boolean;
    /**
     * Determines which axis the tooltip should track the cursor on.
     * @default 'none'
     */
    trackCursorAxis?: 'none' | 'x' | 'y' | 'both';
    /**
     * How long to wait before opening the tooltip. Specified in milliseconds.
     * @default 600
     */
    delay?: number;
    /**
     * How long to wait before closing the tooltip. Specified in milliseconds.
     * @default 0
     */
    closeDelay?: number;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the tooltip will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the tooltip manually.
     * Useful when the tooltip's animation is controlled by an external library.
     */
    actionsRef?: Actions;
    /**
     * Whether the tooltip is disabled.
     * @default false
     */
    disabled?: boolean;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = TooltipOpenChangeReason;
}
