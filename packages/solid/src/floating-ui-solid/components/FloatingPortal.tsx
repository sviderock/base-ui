import {
  createContext,
  createEffect,
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

import type { OpenChangeReason } from '../types';
import { createAttribute } from '../utils/createAttribute';

type FocusManagerState = {
  modal: boolean;
  open: boolean;
  onOpenChange(open: boolean, event?: Event, reason?: OpenChangeReason): void;
  domReference: Element | undefined;
  closeOnFocusOut: boolean;
} | null;

const PortalContext = createContext<{
  preserveTabOrder: Accessor<boolean>;
  portalNode: Accessor<HTMLElement | undefined>;
  setFocusManagerState: (state: FocusManagerState) => void;
  beforeInsideRef: Accessor<HTMLSpanElement | undefined>;
  setBeforeInsideRef: (el: HTMLSpanElement | undefined) => void;
  afterInsideRef: Accessor<HTMLSpanElement | undefined>;
  setAfterInsideRef: (el: HTMLSpanElement | undefined) => void;
  beforeOutsideRef: Accessor<HTMLSpanElement | undefined>;
  setBeforeOutsideRef: (el: HTMLSpanElement | undefined) => void;
  afterOutsideRef: Accessor<HTMLSpanElement | undefined>;
  setAfterOutsideRef: (el: HTMLSpanElement | undefined) => void;
}>();

export const usePortalContext = () => useContext(PortalContext);

const attr = createAttribute('portal');

export interface UseFloatingPortalNodeProps {
  id?: Accessor<string | undefined>;
  root?: Accessor<HTMLElement | ShadowRoot | undefined>;
}

/**
 * @see https://floating-ui.com/docs/FloatingPortal#usefloatingportalnode
 */
export function useFloatingPortalNode(props: UseFloatingPortalNodeProps = {}) {
  const uniqueId = useId();
  const portalContext = usePortalContext();

  const [portalNode, setPortalNode] = createSignal<HTMLElement>();

  let portalNodeRef: HTMLDivElement | null = null;

  createEffect(() => {
    onCleanup(() => {
      portalNode()?.remove();
      // Allow the subsequent layout effects to create a new node on updates.
      // The portal node will still be cleaned up on unmount.
      // https://github.com/floating-ui/floating-ui/issues/2454
      queueMicrotask(() => {
        portalNodeRef = null;
      });
    });
  });

  createEffect(() => {
    // Wait for the uniqueId to be generated before creating the portal node in
    // React <18 (using `useFloatingId` instead of the native `useId`).
    // https://github.com/floating-ui/floating-ui/issues/2778
    const uid = uniqueId();
    if (!uid) {
      return;
    }
    if (portalNodeRef) {
      return;
    }
    const id = props.id?.();
    const existingIdRoot = id ? document.getElementById(id) : null;
    if (!existingIdRoot) {
      return;
    }

    const subRoot = document.createElement('div');
    subRoot.id = uid;
    subRoot.setAttribute(attr, '');
    existingIdRoot.appendChild(subRoot);
    portalNodeRef = subRoot;
    setPortalNode(subRoot);
  });

  createEffect(() => {
    // Wait for the root to exist before creating the portal node. The root must
    // be stored in state, not a ref, for this to work reactively.
    const root = props.root?.();
    if (root === null) {
      return;
    }

    const uid = uniqueId();
    if (!uid) {
      return;
    }
    if (portalNodeRef) {
      return;
    }

    let container = root || portalContext?.portalNode() || document.body;

    let idWrapper: HTMLDivElement | null = null;
    const id = props.id?.();
    if (id) {
      idWrapper = document.createElement('div');
      idWrapper.id = id;
      container.appendChild(idWrapper);
    }

    const subRoot = document.createElement('div');

    subRoot.id = uid;
    subRoot.setAttribute(attr, '');

    container = idWrapper || container;
    container.appendChild(subRoot);

    portalNodeRef = subRoot;
    setPortalNode(subRoot);
  });

  return portalNode;
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
  root?: UseFloatingPortalNodeProps['root'];
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
  const portalNode = useFloatingPortalNode({ id: () => props.id, root: () => props.root?.() });
  const [focusManagerState, setFocusManagerState] = createSignal<FocusManagerState>(null);

  const [beforeOutsideRef, setBeforeOutsideRef] = createSignal<HTMLSpanElement>();
  const [afterOutsideRef, setAfterOutsideRef] = createSignal<HTMLSpanElement>();
  const [beforeInsideRef, setBeforeInsideRef] = createSignal<HTMLSpanElement>();
  const [afterInsideRef, setAfterInsideRef] = createSignal<HTMLSpanElement>();

  const modal = () => focusManagerState()?.modal;
  const open = () => focusManagerState()?.open;

  const shouldRenderGuards = () =>
    // The FocusManager and therefore floating element are currently open/
    // rendered.
    !!focusManagerState() &&
    // Guards are only for non-modal focus management.
    !focusManagerState()!.modal &&
    // Don't render if unmount is transitioning.
    focusManagerState()!.open &&
    preserveTabOrder() &&
    !!(props.root?.() || portalNode());

  // https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/TabbablePortal.tsx
  createEffect(() => {
    const node = portalNode();
    if (!node || !preserveTabOrder() || modal()) {
      return;
    }

    // Make sure elements inside the portal element are tabbable only when the
    // portal has already been focused, either by tabbing into a focus trap
    // element outside or using the mouse.
    function onFocus(event: FocusEvent) {
      if (node && isOutsideEvent(event)) {
        const focusing = event.type === 'focusin';
        const manageFocus = focusing ? enableFocusInside : disableFocusInside;
        manageFocus(node);
      }
    }
    // Listen to the event on the capture phase so they run before the focus
    // trap elements onFocus prop is called.
    node.addEventListener('focusin', onFocus, true);
    node.addEventListener('focusout', onFocus, true);
    onCleanup(() => {
      node.removeEventListener('focusin', onFocus, true);
      node.removeEventListener('focusout', onFocus, true);
    });
  });

  createEffect(() => {
    const node = portalNode();
    if (!node) {
      return;
    }
    if (open()) {
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
          ref={(el) => {
            setBeforeOutsideRef(el);
          }}
          onFocus={(event) => {
            if (isOutsideEvent(event, portalNode())) {
              beforeInsideRef()?.focus();
            } else {
              const domReference = focusManagerState() ? focusManagerState()!.domReference : null;
              const prevTabbable = getPreviousTabbable(domReference);
              prevTabbable?.focus();
            }
          }}
        />
      </Show>

      <Show when={shouldRenderGuards() && portalNode()}>
        <span aria-owns={portalNode()!.id} style={visuallyHidden} />
      </Show>

      <Show when={portalNode()}>
        <Portal>{props.children}</Portal>
      </Show>

      <Show when={shouldRenderGuards() && portalNode()}>
        <FocusGuard
          data-type="outside"
          ref={(el) => {
            setAfterOutsideRef(el);
          }}
          onFocus={(event) => {
            if (isOutsideEvent(event, portalNode())) {
              afterInsideRef()?.focus();
            } else {
              const domReference = focusManagerState() ? focusManagerState()!.domReference : null;
              const nextTabbable = getNextTabbable(domReference);
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
