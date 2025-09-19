'use client';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Accessor,
} from 'solid-js';
import {
  FloatingRootContext,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useRole,
  type OpenChangeReason as FloatingUIOpenChangeReason,
} from '../../floating-ui-solid';
import { getTarget } from '../../floating-ui-solid/utils';
import { access, type MaybeAccessor, type ReactLikeRef } from '../../solid-helpers';
import {
  translateOpenChangeReason,
  type BaseOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import type { HTMLProps, RequiredExcept } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { type InteractionType } from '../../utils/useEnhancedClickHandler';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { useScrollLock } from '../../utils/useScrollLock';
import { useTransitionStatus, type TransitionStatus } from '../../utils/useTransitionStatus';

export type DialogOpenChangeReason = BaseOpenChangeReason | 'close-press';

export function useDialogRoot(params: useDialogRoot.Parameters): useDialogRoot.ReturnValue {
  const defaultOpen = () => access(params.defaultOpen);
  const dismissible = () => access(params.dismissible);
  const modal = () => access(params.modal);
  const openParam = () => access(params.open);

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'DialogRoot',
    state: 'open',
  });

  const refs: useDialogRoot.ReturnValue['refs'] = {
    popupRef: null,
    backdropRef: null,
    internalBackdropRef: null,
  };

  const [titleElementId, setTitleElementId] = createSignal<string | undefined>(undefined);
  const [descriptionElementId, setDescriptionElementId] = createSignal<string | undefined>(
    undefined,
  );
  const [triggerElement, setTriggerElement] = createSignal<Element | null>(null);
  const [popupElement, setPopupElement] = createSignal<HTMLElement | null>(null);

  const [transitionStatus, setTransitionStatus] = useTransitionStatus(open);

  const setOpen = (
    nextOpen: boolean,
    event: Event | undefined,
    reason: DialogOpenChangeReason | undefined,
  ) => {
    params.onOpenChange?.(nextOpen, event, reason);
    setOpenUnwrapped(nextOpen);
  };

  const handleUnmount = () => {
    setTransitionStatus('mounted', false);
    params.onOpenChangeComplete?.(false);
  };

  useOpenChangeComplete({
    enabled: !params.actionsRef,
    open,
    ref: () => refs.popupRef,
    onComplete() {
      if (!open()) {
        handleUnmount();
      }
    },
  });

  onMount(() => {
    if (params.actionsRef) {
      params.actionsRef.current = { unmount: handleUnmount };
    }
  });

  const handleFloatingUIOpenChange = (
    nextOpen: boolean,
    event: Event | undefined,
    reason: FloatingUIOpenChangeReason | undefined,
  ) => {
    setOpen(nextOpen, event, translateOpenChangeReason(reason));
  };

  const context = useFloatingRootContext({
    elements: { reference: triggerElement, floating: popupElement },
    open,
    onOpenChange: handleFloatingUIOpenChange,
  });

  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = createSignal(0);
  const isTopmost = () => ownNestedOpenDialogs() === 0;

  const role = useRole(context);
  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
    outsidePress(event) {
      if (event.button !== 0) {
        return false;
      }
      const target = getTarget(event) as Element | null;
      if (isTopmost() && dismissible()) {
        const backdrop = target as HTMLDivElement | null;
        // Only close if the click occurred on the dialog's owning backdrop.
        // This supports multiple modal dialogs that aren't nested in the React tree:
        // https://github.com/mui/base-ui/issues/1320
        if (modal()) {
          return backdrop
            ? refs.internalBackdropRef === backdrop || refs.backdropRef === backdrop
            : false;
        }
        return true;
      }
      return false;
    },
    escapeKey: isTopmost,
  });

  useScrollLock({
    enabled: () => open() && modal() === true,
    mounted: transitionStatus.mounted,
    open,
    referenceElement: popupElement,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions(() => [
    role(),
    click(),
    dismiss(),
  ]);

  createEffect(() => {
    if (params.onNestedDialogOpen && open()) {
      params.onNestedDialogOpen(ownNestedOpenDialogs());
    }

    if (params.onNestedDialogClose && !open()) {
      params.onNestedDialogClose();
    }

    onCleanup(() => {
      if (params.onNestedDialogClose && open()) {
        params.onNestedDialogClose();
      }
    });
  });

  const handleNestedDialogOpen = (ownChildrenCount: number) => {
    setOwnNestedOpenDialogs(ownChildrenCount + 1);
  };

  const handleNestedDialogClose = () => {
    setOwnNestedOpenDialogs(0);
  };

  const { openMethod, triggerProps } = useOpenInteractionType(open);

  const dialogTriggerProps = createMemo(() => getReferenceProps(triggerProps));

  return {
    modal,
    setOpen,
    open,
    titleElementId,
    setTitleElementId,
    descriptionElementId,
    setDescriptionElementId,
    onNestedDialogOpen: handleNestedDialogOpen,
    onNestedDialogClose: handleNestedDialogClose,
    nestedOpenDialogCount: ownNestedOpenDialogs,
    openMethod,
    mounted: () => transitionStatus.mounted,
    transitionStatus: () => transitionStatus.transitionStatus,
    triggerProps: dialogTriggerProps,
    getPopupProps: getFloatingProps,
    setTriggerElement,
    setPopupElement,
    refs,
    floatingRootContext: context,
  } satisfies useDialogRoot.ReturnValue;
}

export namespace useDialogRoot {
  export interface SharedParameters {
    /**
     * Whether the dialog is currently open.
     */
    open?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the dialog is initially open.
     *
     * To render a controlled dialog, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: MaybeAccessor<boolean | undefined>;
    /**
     * Determines if the dialog enters a modal state when open.
     * - `true`: user interaction is limited to just the dialog: focus is trapped, document page scroll is locked, and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * - `'trap-focus'`: focus is trapped inside the dialog, but document page scroll is not locked and pointer interactions outside of it remain enabled.
     * @default true
     */
    modal?: MaybeAccessor<boolean | 'trap-focus' | undefined>;
    /**
     * Event handler called when the dialog is opened or closed.
     * @type (open: boolean, event?: Event, reason?: Dialog.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: DialogOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the dialog is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Determines whether the dialog should close on outside clicks.
     * @default true
     */
    dismissible?: MaybeAccessor<boolean | undefined>;
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the dialog will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the dialog manually.
     * Useful when the dialog's animation is controlled by an external library.
     */
    actionsRef?: ReactLikeRef<{ unmount: () => void }>;
  }

  export interface Parameters
    extends RequiredExcept<
      SharedParameters,
      'open' | 'onOpenChange' | 'onOpenChangeComplete' | 'actionsRef'
    > {
    /**
     * Callback to invoke when a nested dialog is opened.
     */
    onNestedDialogOpen?: (ownChildrenCount: number) => void;
    /**
     * Callback to invoke when a nested dialog is closed.
     */
    onNestedDialogClose?: () => void;
    /**
     * A ref to imperative actions.
     */
    actionsRef?: ReactLikeRef<Actions>;
  }

  export interface ReturnValue {
    /**
     * The id of the description element associated with the dialog.
     */
    descriptionElementId: Accessor<string | undefined>;
    /**
     * Whether the dialog enters a modal state when open.
     */
    modal: Accessor<boolean | 'trap-focus' | undefined>;
    /**
     * Number of nested dialogs that are currently open.
     */
    nestedOpenDialogCount: Accessor<number>;
    /**
     * Callback to invoke when a nested dialog is closed.
     */
    onNestedDialogClose?: () => void;
    /**
     * Callback to invoke when a nested dialog is opened.
     */
    onNestedDialogOpen?: (ownChildrenCount: number) => void;
    /**
     * Event handler called when the dialog is opened or closed.
     */
    setOpen: (
      open: boolean,
      event: Event | undefined,
      reason: DialogOpenChangeReason | undefined,
    ) => void;
    /**
     * Whether the dialog is currently open.
     */
    open: Accessor<boolean>;
    /**
     * Determines what triggered the dialog to open.
     */
    openMethod: Accessor<InteractionType | null>;
    /**
     * Callback to set the id of the description element associated with the dialog.
     */
    setDescriptionElementId: (elementId: string | undefined) => void;
    /**
     * Callback to set the id of the title element.
     */
    setTitleElementId: (elementId: string | undefined) => void;
    /**
     * The id of the title element associated with the dialog.
     */
    titleElementId: Accessor<string | undefined>;
    /**
     * Determines if the dialog should be mounted.
     */
    mounted: Accessor<boolean>;
    /**
     * The transition status of the dialog.
     */
    transitionStatus: Accessor<TransitionStatus>;
    /**
     * Resolver for the Trigger element's props.
     */
    triggerProps: Accessor<HTMLProps>;
    /**
     * Resolver for the Popup element's props.
     */
    getPopupProps: (externalProps?: HTMLProps) => HTMLProps;
    /**
     * Callback to register the Trigger element DOM node.
     */
    setTriggerElement: (element: Element | null | undefined) => void;
    /**
     * Callback to register the Popup element DOM node.
     */
    setPopupElement: (element: HTMLElement | null | undefined) => void;
    /**
     * Refs to the dialog elements.
     */
    refs: {
      /**
       * The ref to the Popup element.
       */
      popupRef: HTMLElement | null | undefined;
      /**
       * A ref to the backdrop element.
       */
      backdropRef: HTMLDivElement | null | undefined;
      /**
       * A ref to the internal backdrop element.
       */
      internalBackdropRef: HTMLDivElement | null | undefined;
    };
    /**
     * The Floating UI root context.
     */
    floatingRootContext: FloatingRootContext;
  }

  export interface Actions {
    unmount: () => void;
  }
}
