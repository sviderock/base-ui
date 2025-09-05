import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  Show,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import { FocusGuard } from '../../utils/FocusGuard';
import { useId } from '../../utils/useId';
import { visuallyHidden } from '../../utils/visuallyHidden';
import {
  disableFocusInside,
  enableFocusInside,
  getNextTabbable,
  getPreviousTabbable,
  isOutsideEvent,
} from '../utils';

import { type OpenChangeReason } from '../types';
import { createAttribute } from '../utils/createAttribute';

type FocusManagerState = {
  modal: boolean;
  open: boolean;
  onOpenChange(open: boolean, event?: Event, reason?: OpenChangeReason): void;
  domReference: Element | null;
  closeOnFocusOut: boolean;
} | null;

const PortalContext = createContext<{
  preserveTabOrder: Accessor<boolean>;
  portalNode: Accessor<HTMLElement | null>;
  setFocusManagerState: (state: FocusManagerState | null) => void;
  beforeInsideRef: Accessor<HTMLSpanElement | null>;
  setBeforeInsideRef: (el: HTMLSpanElement | null) => void;
  afterInsideRef: Accessor<HTMLSpanElement | null>;
  setAfterInsideRef: (el: HTMLSpanElement | null) => void;
  beforeOutsideRef: Accessor<HTMLSpanElement | null>;
  setBeforeOutsideRef: (el: HTMLSpanElement | null) => void;
  afterOutsideRef: Accessor<HTMLSpanElement | null>;
  setAfterOutsideRef: (el: HTMLSpanElement | null) => void;
}>();

export const usePortalContext = () => useContext(PortalContext);

const attr = createAttribute('portal');

export interface UseFloatingPortalNodeProps {
  id?: Accessor<string | undefined>;
  root?: Accessor<HTMLElement | ShadowRoot | null | undefined>;
  preserveTabOrder?: Accessor<boolean>;
  modal?: Accessor<boolean | undefined>;
}

/**
 * @see https://floating-ui.com/docs/FloatingPortal#usefloatingportalnode
 */
export function useFloatingPortalNode(props: UseFloatingPortalNodeProps = {}) {
  const uniqueId = useId();
  const [portalNode, setPortalNode] = createSignal<HTMLElement | null>(null);
  const portalContext = usePortalContext();

  const portalMount = createMemo<Parameters<typeof Portal>[0]['mount']>(() => {
    const id = props.id?.();
    const root = props.root?.();

    const existingIdRoot = id ? document.getElementById(id) : null;
    if (existingIdRoot) {
      return existingIdRoot;
    }

    const container = root || portalContext?.portalNode() || document.body;
    let idWrapper: HTMLDivElement | null = null;
    if (id) {
      idWrapper = document.createElement('div');
      idWrapper.id = id;
      container.appendChild(idWrapper);
    }

    return container;
  });

  function portalRef(el: HTMLDivElement) {
    const uid = uniqueId();
    if (uid) {
      el.id = uid;
      el.setAttribute(attr, '');

      // Make sure elements inside the portal element are tabbable only when the
      // portal has already been focused, either by tabbing into a focus trap
      // element outside or using the mouse.
      function onFocus(event: FocusEvent) {
        if (!props.preserveTabOrder?.() || props.modal?.()) {
          return;
        }

        if (isOutsideEvent(event)) {
          const focusing = event.type === 'focusin';
          const manageFocus = focusing ? enableFocusInside : disableFocusInside;
          manageFocus(el);
        }
      }

      // Listen to the event on the capture phase so they run before the focus
      // trap elements onFocus prop is called.
      el.addEventListener('focusin', onFocus, true);
      el.addEventListener('focusout', onFocus, true);
      onCleanup(() => {
        el.removeEventListener('focusin', onFocus, true);
        el.removeEventListener('focusout', onFocus, true);
      });

      setPortalNode(el);
    }
  }

  return { portalMount, portalRef, portalNode };
}

export interface FloatingPortalProps {
  children?: JSX.Element;
  /**
   * Optionally selects the node with the id if it exists, or create it and
   * append it to the specified `root` (by default `document.body`).
   */
  id?: string;
  /**
   * Specifies the root node the portal container will be appended to.
   */
  root?: ReturnType<Exclude<UseFloatingPortalNodeProps['root'], undefined>>;
  /**
   * When using non-modal focus management using `FloatingFocusManager`, this
   * will preserve the tab order context based on the React tree instead of the
   * DOM tree.
   */
  preserveTabOrder?: boolean;
}

/**
 * Portals the floating element into a given container element — by default,
 * outside of the app root and into the body.
 * This is necessary to ensure the floating element can appear outside any
 * potential parent containers that cause clipping (such as `overflow: hidden`),
 * while retaining its location in the React tree.
 * @see https://floating-ui.com/docs/FloatingPortal
 * @internal
 */
export function FloatingPortal(props: FloatingPortalProps): JSX.Element {
  const preserveTabOrder = () => props.preserveTabOrder ?? true;
  const [focusManagerState, setFocusManagerState] = createSignal<FocusManagerState>(null);

  const { portalMount, portalRef, portalNode } = useFloatingPortalNode({
    id: () => props.id,
    root: () => props.root,
    modal: () => focusManagerState()?.modal,
    preserveTabOrder,
  });
  const [beforeOutsideRef, setBeforeOutsideRef] = createSignal<HTMLSpanElement | null>(null);
  const [afterOutsideRef, setAfterOutsideRef] = createSignal<HTMLSpanElement | null>(null);
  const [beforeInsideRef, setBeforeInsideRef] = createSignal<HTMLSpanElement | null>(null);
  const [afterInsideRef, setAfterInsideRef] = createSignal<HTMLSpanElement | null>(null);

  const shouldRenderGuards = () =>
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!focusManagerState() &&
    // Guards are only for non-modal focus management.
    !focusManagerState()!.modal &&
    // Don't render if unmount is transitioning.
    focusManagerState()!.open &&
    preserveTabOrder();

  createEffect(() => {
    const node = portalNode();
    if (!node) {
      return;
    }

    if (focusManagerState()?.open) {
      return;
    }

    enableFocusInside(node);
  });

  return (
    <PortalContext.Provider
      value={{
        preserveTabOrder,
        beforeOutsideRef,
        setBeforeOutsideRef,
        afterOutsideRef,
        setAfterOutsideRef,
        beforeInsideRef,
        setBeforeInsideRef,
        afterInsideRef,
        setAfterInsideRef,
        portalNode,
        setFocusManagerState,
      }}
    >
      <Show when={shouldRenderGuards() && portalNode()}>
        <FocusGuard
          data-type="outside"
          ref={setBeforeOutsideRef}
          onFocus={(event) => {
            const node = portalNode()!;
            if (isOutsideEvent(event, node)) {
              enableFocusInside(node);
              beforeInsideRef()?.focus();
            } else {
              disableFocusInside(node);
              const domReference = focusManagerState()?.domReference;
              const prevTabbable = getPreviousTabbable(domReference!);
              prevTabbable?.focus();
            }
          }}
        />
      </Show>

      <Show when={shouldRenderGuards() && portalNode()}>
        <span aria-owns={portalNode()!.id} style={visuallyHidden} />
      </Show>

      <Portal mount={portalMount()} ref={portalRef}>
        {props.children}
      </Portal>

      <Show when={shouldRenderGuards() && portalNode()}>
        <FocusGuard
          data-type="outside"
          ref={setAfterOutsideRef}
          onFocus={(event) => {
            const node = portalNode()!;
            if (isOutsideEvent(event, node)) {
              afterInsideRef()?.focus();
            } else {
              const domReference = focusManagerState()?.domReference;
              const nextTabbable = getNextTabbable(domReference!);
              nextTabbable?.focus();

              if (focusManagerState()?.closeOnFocusOut) {
                focusManagerState()?.onOpenChange(false, event, 'focus-out');
              }
            }
          }}
        />
      </Show>
    </PortalContext.Provider>
  );
}
