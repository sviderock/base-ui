'use client';
import { batch, createSignal, onMount, type JSX } from 'solid-js';
import {
  safePolygon,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
} from '../../floating-ui-solid';
import { combineProps } from '../../merge-props';
import { useFocusWithDelay } from '../../utils/interactions/useFocusWithDelay';
import {
  translateOpenChangeReason,
  type BaseOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useControlled } from '../../utils/useControlled';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { CLOSE_DELAY, OPEN_DELAY } from '../utils/constants';
import { PreviewCardRootContext } from './PreviewCardContext';

/**
 * Groups all parts of the preview card.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardRoot(props: PreviewCardRoot.Props) {
  const delayWithDefault = () => props.delay ?? OPEN_DELAY;
  const closeDelayWithDefault = () => props.closeDelay ?? CLOSE_DELAY;

  const [triggerElement, setTriggerElement] = createSignal<Element | null | undefined>(null);
  const [positionerElement, setPositionerElement] = createSignal<HTMLElement | null | undefined>(
    null,
  );
  const [instantTypeState, setInstantTypeState] = createSignal<'dismiss' | 'focus'>();

  const refs: PreviewCardRootContext['refs'] = {
    popupRef: null,
  };

  const [open, setOpenUnwrapped] = useControlled({
    controlled: () => props.open,
    default: () => props.defaultOpen,
    name: 'PreviewCard',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const handleUnmount = () => {
    batch(() => {
      setMounted(false);
      props.onOpenChangeComplete?.(false);
    });
  };

  useOpenChangeComplete({
    enabled: () => !props.actionsRef,
    open,
    ref: () => refs.popupRef,
    onComplete() {
      if (!open()) {
        handleUnmount();
      }
    },
  });

  onMount(() => {
    if (props.actionsRef) {
      props.actionsRef.unmount = handleUnmount;
    }
  });

  const setOpen = (
    nextOpen: boolean,
    event: Event | undefined,
    reason: BaseOpenChangeReason | undefined,
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

  const context = useFloatingRootContext({
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
    },
  });

  const instantType = () => instantTypeState();
  const computedRestMs = () => delayWithDefault();

  const hover = useHover(context, {
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    restMs: computedRestMs,
    delay: () => ({
      close: closeDelayWithDefault(),
    }),
  });
  const focus = useFocusWithDelay(context, { delay: OPEN_DELAY });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss]);

  const contextValue: PreviewCardRootContext = {
    open,
    setOpen,
    mounted,
    setMounted,
    setTriggerElement,
    positionerElement,
    setPositionerElement,
    refs,
    triggerProps: (externalProps) => combineProps(externalProps, getReferenceProps()),
    popupProps: (externalProps) => combineProps(externalProps, getFloatingProps()),
    floatingRootContext: context,
    instantType,
    transitionStatus,
    // eslint-disable-next-line solid/reactivity
    onOpenChangeComplete: props.onOpenChangeComplete,
    delay: delayWithDefault,
    closeDelay: closeDelayWithDefault,
  };

  return (
    <PreviewCardRootContext.Provider value={contextValue}>
      {props.children}
    </PreviewCardRootContext.Provider>
  );
}

export namespace PreviewCardRoot {
  export interface State {}

  export interface Props {
    children?: JSX.Element;
    /**
     * Whether the preview card is initially open.
     *
     * To render a controlled preview card, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Whether the preview card is currently open.
     */
    open?: boolean;
    /**
     * Event handler called when the preview card is opened or closed.
     * @type (open: boolean, event?: Event, reason?: PreviewCard.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the preview card is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * How long to wait before the preview card opens. Specified in milliseconds.
     * @default 600
     */
    delay?: number;
    /**
     * How long to wait before closing the preview card. Specified in milliseconds.
     * @default 300
     */
    closeDelay?: number;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the preview card will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the preview card manually.
     * Useful when the preview card's animation is controlled by an external library.
     */
    actionsRef?: Actions;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = BaseOpenChangeReason;
}
