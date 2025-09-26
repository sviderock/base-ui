import { getNodeName, isHTMLElement } from '@floating-ui/utils/dom';
import { createEffect, createMemo, createSignal, on, onCleanup, Show, type JSX } from 'solid-js';
import { focusable, isTabbable, tabbable, type FocusableElement } from 'tabbable';
import { FocusGuard } from '../../utils/FocusGuard';
import { visuallyHidden } from '../../utils/visuallyHidden';
import {
  activeElement,
  contains,
  getDocument,
  getFloatingFocusElement,
  getNextTabbable,
  getNodeAncestors,
  getNodeChildren,
  getPreviousTabbable,
  getTabbableOptions,
  getTarget,
  isOutsideEvent,
  isTypeableCombobox,
  isVirtualClick,
  isVirtualPointerEvent,
  stopEvent,
} from '../utils';

import type { FloatingRootContext, OpenChangeReason } from '../types';
import { createAttribute } from '../utils/createAttribute';
import { enqueueFocus } from '../utils/enqueueFocus';
import { markOthers, supportsInert } from '../utils/markOthers';
import { usePortalContext } from './FloatingPortal';
import { useFloatingTree } from './FloatingTree';

const LIST_LIMIT = 20;
let previouslyFocusedElements: Element[] = [];

function addPreviouslyFocusedElement(element: Element | null) {
  previouslyFocusedElements = previouslyFocusedElements.filter((el) => el.isConnected);

  if (element && getNodeName(element) !== 'body') {
    previouslyFocusedElements.push(element);
    if (previouslyFocusedElements.length > LIST_LIMIT) {
      previouslyFocusedElements = previouslyFocusedElements.slice(-LIST_LIMIT);
    }
  }
}

function getPreviouslyFocusedElement() {
  return previouslyFocusedElements
    .slice()
    .reverse()
    .find((el) => el.isConnected);
}

function getFirstTabbableElement(container: Element) {
  const tabbableOptions = getTabbableOptions();
  if (isTabbable(container, tabbableOptions)) {
    return container;
  }

  return tabbable(container, tabbableOptions)[0] || container;
}

function handleTabIndex(
  floatingFocusElement: HTMLElement,
  orderRef: Array<'reference' | 'floating' | 'content'>,
) {
  if (
    !orderRef.includes('floating') &&
    !floatingFocusElement.getAttribute('role')?.includes('dialog')
  ) {
    return;
  }

  const options = getTabbableOptions();
  const focusableElements = focusable(floatingFocusElement, options);
  const tabbableContent = focusableElements.filter((element) => {
    const dataTabIndex = element.getAttribute('data-tabindex') || '';
    return (
      isTabbable(element, options) ||
      (element.hasAttribute('data-tabindex') && !dataTabIndex.startsWith('-'))
    );
  });
  const tabIndex = floatingFocusElement.getAttribute('tabindex');

  if (orderRef.includes('floating') || tabbableContent.length === 0) {
    if (tabIndex !== '0') {
      floatingFocusElement.setAttribute('tabindex', '0');
    }
  } else if (
    tabIndex !== '-1' ||
    (floatingFocusElement.hasAttribute('data-tabindex') &&
      floatingFocusElement.getAttribute('data-tabindex') !== '-1')
  ) {
    floatingFocusElement.setAttribute('tabindex', '-1');
    floatingFocusElement.setAttribute('data-tabindex', '-1');
  }
}

function VisuallyHiddenDismiss(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type="button" tabIndex={-1} style={visuallyHidden} />;
}

export interface FloatingFocusManagerProps {
  children: JSX.Element;
  /**
   * The floating context returned from `useFloatingRootContext`.
   */
  context: FloatingRootContext;
  /**
   * Whether or not the focus manager should be disabled. Useful to delay focus
   * management until after a transition completes or some other conditional
   * state.
   * @default false
   */
  disabled?: boolean;
  /**
   * The order in which focus cycles.
   * @default ['content']
   */
  order?: Array<'reference' | 'floating' | 'content'>;
  /**
   * Which element to initially focus. Can be either a number (tabbable index as
   * specified by the `order`) or a ref.
   * @default 0
   */
  initialFocus?: number | HTMLElement | null;
  /**
   * Determines if the focus guards are rendered. If not, focus can escape into
   * the address bar/console/browser UI, like in native dialogs.
   * @default true
   */
  guards?: boolean;
  /**
   * Determines if focus should be returned to the reference element once the
   * floating element closes/unmounts (or if that is not available, the
   * previously focused element). This prop is ignored if the floating element
   * lost focus.
   * It can be also set to a ref to explicitly control the element to return focus to.
   * @default true
   */
  returnFocus?: boolean | HTMLElement | null;
  /**
   * Determines if focus should be restored to the nearest tabbable element if
   * focus inside the floating element is lost (such as due to the removal of
   * the currently focused element from the DOM).
   * @default false
   */
  restoreFocus?: boolean;
  /**
   * Determines if focus is “modal”, meaning focus is fully trapped inside the
   * floating element and outside content cannot be accessed. This includes
   * screen reader virtual cursors.
   * @default true
   */
  modal?: boolean;
  /**
   * If your focus management is modal and there is no explicit close button
   * available, you can use this prop to render a visually-hidden dismiss
   * button at the start and end of the floating element. This allows
   * touch-based screen readers to escape the floating element due to lack of
   * an `esc` key.
   * @default undefined
   */
  visuallyHiddenDismiss?: boolean | string;
  /**
   * Determines whether `focusout` event listeners that control whether the
   * floating element should be closed if the focus moves outside of it are
   * attached to the reference and floating elements. This affects non-modal
   * focus management.
   * @default true
   */
  closeOnFocusOut?: boolean;
  /**
   * Determines whether outside elements are `inert` when `modal` is enabled.
   * This enables pointer modality without a backdrop.
   * @default false
   */
  outsideElementsInert?: boolean;
  /**
   * Returns a list of elements that should be considered part of the
   * floating element.
   */
  getInsideElements?: () => Element[];
}

/**
 * Provides focus management for the floating element.
 * @see https://floating-ui.com/docs/FloatingFocusManager
 * @internal
 */
export function FloatingFocusManager(props: FloatingFocusManagerProps): JSX.Element {
  const disabled = () => props.disabled ?? false;
  const order = () => props.order ?? ['content'];
  const guardsProp = () => props.guards ?? true;
  const initialFocus = () => props.initialFocus ?? 0;
  const returnFocus = () => props.returnFocus ?? true;
  const restoreFocus = () => props.restoreFocus ?? false;
  const modal = () => props.modal ?? true;
  const visuallyHiddenDismiss = () => props.visuallyHiddenDismiss ?? false;
  const closeOnFocusOut = () => props.closeOnFocusOut ?? true;
  const outsideElementsInert = () => props.outsideElementsInert ?? false;
  const getInsideElements = () => props.getInsideElements?.() ?? [];
  const getNodeId = () => props.context.dataRef.floatingContext?.nodeId();

  const ignoreInitialFocus = () =>
    typeof initialFocus() === 'number' && (initialFocus() as number) < 0;
  // If the reference is a combobox and is typeable (e.g. input/textarea),
  // there are different focus semantics. The guards should not be rendered, but
  // aria-hidden should be applied to all nodes still. Further, the visually
  // hidden dismiss button should only appear at the end of the list, not the
  // start.
  const isUntrappedTypeableCombobox = () =>
    isTypeableCombobox(props.context.elements.domReference()) && ignoreInitialFocus();

  // Force the guards to be rendered if the `inert` attribute is not supported.
  const inertSupported = () => supportsInert();
  const guards = () => (inertSupported() ? guardsProp() : true);
  const useInert = () => !guards() || (inertSupported() && outsideElementsInert());

  const tree = useFloatingTree();
  const portalContext = usePortalContext();

  const [startDismissButtonRef, setStartDismissButtonRef] = createSignal<HTMLButtonElement | null>(
    null,
  );
  const [endDismissButtonRef, setEndDismissButtonRef] = createSignal<HTMLButtonElement | null>(
    null,
  );
  let preventReturnFocusRef = false;
  let isPointerDownRef = false;
  let tabbableIndexRef = -1;

  const isInsidePortal = () => portalContext !== undefined;
  const floatingFocusElement = createMemo(() =>
    getFloatingFocusElement(props.context.elements.floating()),
  );

  const getTabbableContent = (containerProp?: Element) => {
    const container = containerProp ?? floatingFocusElement();
    return container ? tabbable(container, getTabbableOptions()) : [];
  };

  const getTabbableElements = (container?: Element) => {
    const content = getTabbableContent(container);

    return order()
      ?.map((type) => {
        const domReference = props.context.elements.domReference();
        if (domReference && type === 'reference') {
          return domReference;
        }

        const floatingElement = floatingFocusElement();
        if (floatingElement && type === 'floating') {
          return floatingElement;
        }

        return content;
      })
      .filter(Boolean)
      .flat() as Array<FocusableElement>;
  };

  function handleFocusIn(event: FocusEvent) {
    const target = getTarget(event) as Element | null;
    const tabbableContent = getTabbableContent() as Array<Element | null>;
    const tabbableIndex = tabbableContent.indexOf(target);
    if (tabbableIndex !== -1) {
      tabbableIndexRef = tabbableIndex;
    }
  }

  // In Safari, buttons lose focus when pressing them.
  function handlePointerDown() {
    isPointerDownRef = true;
    setTimeout(() => {
      isPointerDownRef = false;
    });
  }

  function handleFocusOutside(event: FocusEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    const currentTarget = event.currentTarget as HTMLElement | null;
    const target = getTarget(event) as HTMLElement | null;
    const isModal = modal();
    const untrappedTypeableCombobox = isUntrappedTypeableCombobox();
    const floatingElement = floatingFocusElement();
    const previouslyFocusedElement = getPreviouslyFocusedElement();
    const domReference = props.context.elements.domReference();
    const floating = props.context.elements.floating();
    const nodeId = getNodeId();
    const portalNode = portalContext?.portalNode();
    const restoreFocusValue = restoreFocus();
    const tabbableContent = getTabbableContent() as Array<Element | null>;
    const orderValue = order();

    const movedToUnrelatedNode = !(
      contains(domReference, relatedTarget) ||
      contains(floating, relatedTarget) ||
      contains(relatedTarget, floating) ||
      contains(portalNode, relatedTarget) ||
      relatedTarget?.hasAttribute(createAttribute('focus-guard')) ||
      (tree &&
        (getNodeChildren(tree.nodesRef, nodeId).find(
          (node) =>
            contains(node.context?.elements.floating(), relatedTarget) ||
            contains(node.context?.elements.domReference(), relatedTarget),
        ) ||
          getNodeAncestors(tree.nodesRef, nodeId).find(
            (node) =>
              [
                node.context?.elements.floating(),
                getFloatingFocusElement(node.context?.elements.floating() ?? null),
              ].includes(relatedTarget) || node.context?.elements.domReference() === relatedTarget,
          )))
    );

    // eslint-disable-next-line solid/reactivity
    queueMicrotask(() => {
      if (currentTarget === domReference && floatingElement) {
        handleTabIndex(floatingElement, orderValue);
      }

      // // Restore focus to the previous tabbable element index to prevent
      // // focus from being lost outside the floating tree.
      if (
        restoreFocusValue &&
        currentTarget !== domReference &&
        !target?.isConnected &&
        activeElement(getDocument(floatingElement)) === getDocument(floatingElement).body
      ) {
        // Let `FloatingPortal` effect knows that focus is still inside the
        // floating tree.
        if (isHTMLElement(floatingElement)) {
          floatingElement.focus();
        }

        const prevTabbableIndex = tabbableIndexRef;

        const nodeToFocus =
          tabbableContent[prevTabbableIndex] ||
          tabbableContent[tabbableContent.length - 1] ||
          floatingElement;

        if (isHTMLElement(nodeToFocus)) {
          nodeToFocus.focus();
        }
      }

      if (props.context.dataRef.insidePortal) {
        props.context.dataRef.insidePortal = false;
        return;
      }

      // Focus did not move inside the floating tree, and there are no tabbable
      // portal guards to handle closing.
      if (
        (untrappedTypeableCombobox ? true : !isModal) &&
        relatedTarget &&
        movedToUnrelatedNode &&
        !isPointerDownRef &&
        // Fix React 18 Strict Mode returnFocus due to double rendering.
        relatedTarget !== previouslyFocusedElement
      ) {
        preventReturnFocusRef = true;
        props.context.onOpenChange(false, event, 'focus-out');
      }
    });
  }

  // Dismissing via outside press should always ignore `returnFocus` to
  // prevent unwanted scrolling.
  function onOpenChangeLocal({
    reason,
    event,
    nested,
  }: {
    open: boolean;
    reason: OpenChangeReason;
    event: Event;
    nested: boolean;
  }) {
    if (['hover', 'safe-polygon'].includes(reason) && event.type === 'mouseleave') {
      preventReturnFocusRef = true;
    }
    if (reason !== 'outside-press') {
      return;
    }

    if (nested) {
      preventReturnFocusRef = false;
    } else if (
      isVirtualClick(event as MouseEvent) ||
      isVirtualPointerEvent(event as PointerEvent)
    ) {
      preventReturnFocusRef = false;
    } else {
      let isPreventScrollSupported = false;
      document.createElement('div').focus({
        get preventScroll() {
          isPreventScrollSupported = true;
          return false;
        },
      });

      if (isPreventScrollSupported) {
        preventReturnFocusRef = false;
      } else {
        preventReturnFocusRef = true;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      // The focus guards have nothing to focus, so we need to stop the event.
      const floatingElement = floatingFocusElement();
      if (
        contains(floatingElement, activeElement(getDocument(floatingElement))) &&
        getTabbableContent().length === 0 &&
        !isUntrappedTypeableCombobox()
      ) {
        stopEvent(event);
      }

      const els = getTabbableElements();
      const target = getTarget(event);

      const domReference = props.context.elements.domReference();
      if (order()[0] === 'reference' && target === domReference) {
        stopEvent(event);
        if (event.shiftKey) {
          enqueueFocus(els[els.length - 1]);
        } else {
          enqueueFocus(els[1]);
        }
      }

      if (order()[1] === 'floating' && target === floatingElement && event.shiftKey) {
        stopEvent(event);
        enqueueFocus(els[0]);
      }
    }
  }

  onCleanup(() => {
    const doc = getDocument(floatingFocusElement());
    doc.removeEventListener('keydown', onKeyDown);

    const floating = props.context.elements.floating();
    floating?.removeEventListener('focusin', handleFocusIn);
    floating?.removeEventListener('focusout', handleFocusOutside);

    const domReference = props.context.elements.domReference();
    if (isHTMLElement(domReference)) {
      domReference?.removeEventListener('focusout', handleFocusOutside);
      domReference?.removeEventListener('pointerdown', handlePointerDown);
    }
  });

  createEffect(() => {
    if (disabled()) {
      return;
    }

    const doc = getDocument(floatingFocusElement());
    const floating = props.context.elements.floating();
    const domReference = props.context.elements.domReference();

    floating?.addEventListener('focusin', handleFocusIn);

    if (modal()) {
      doc.addEventListener('keydown', onKeyDown);
    }

    if (closeOnFocusOut() && floating && isHTMLElement(domReference)) {
      domReference.addEventListener('focusout', handleFocusOutside);
      domReference.addEventListener('pointerdown', handlePointerDown);
      floating.addEventListener('focusout', handleFocusOutside);
    }
  });

  createEffect(
    on(disabled, () => {
      // The `returnFocus` cleanup behavior is inside a microtask; ensure we
      // wait for it to complete before resetting the flag.
      queueMicrotask(() => {
        preventReturnFocusRef = false;
      });
    }),
  );

  createEffect(() => {
    const floatingElement = floatingFocusElement();
    if (disabled() || !isHTMLElement(floatingElement)) {
      return;
    }

    const doc = getDocument(floatingElement);
    const previouslyFocusedElement = activeElement(doc);

    // Wait for any layout effect state setters to execute to set `tabIndex`.
    // eslint-disable-next-line solid/reactivity
    queueMicrotask(() => {
      const open = props.context.open();
      const initialFocusIgnored = ignoreInitialFocus();
      const initialFocusValue = initialFocus();
      const focusableElements = getTabbableElements(floatingElement);
      const elToFocus =
        (typeof initialFocusValue === 'number'
          ? focusableElements[initialFocusValue]
          : initialFocusValue) || floatingElement;
      const focusAlreadyInsideFloatingEl = contains(floatingElement, previouslyFocusedElement);

      if (!initialFocusIgnored && !focusAlreadyInsideFloatingEl && open) {
        enqueueFocus(elToFocus, {
          preventScroll: elToFocus === floatingElement,
        });
      }
    });
  });

  const [beforeGuardRef, setBeforeGuardRef] = createSignal<HTMLSpanElement>();
  const [afterGuardRef, setAfterGuardRef] = createSignal<HTMLSpanElement>();

  const insideElements = createMemo(() => {
    const domReference = props.context.elements.domReference();
    // Don't hide portals nested within the parent portal.
    const portalNodes = Array.from(
      portalContext?.portalNode()?.querySelectorAll(`[${createAttribute('portal')}]`) || [],
    );
    const ancestors = tree ? getNodeAncestors(tree.nodesRef, getNodeId()) : [];
    const ancestorFloatingNodes =
      tree && !modal() ? ancestors.map((node) => node.context?.elements.floating()) : [];
    const rootAncestorComboboxDomReference = ancestors
      .find((node) => isTypeableCombobox(node.context?.elements.domReference() ?? null))
      ?.context?.elements.domReference();

    return [
      floatingFocusElement(),
      rootAncestorComboboxDomReference,
      ...portalNodes,
      ...ancestorFloatingNodes,
      ...getInsideElements(),
      startDismissButtonRef(),
      endDismissButtonRef(),
      beforeGuardRef(),
      afterGuardRef(),
      portalContext?.beforeOutsideRef() ?? null,
      portalContext?.afterOutsideRef() ?? null,
      order().includes('reference') || isUntrappedTypeableCombobox() ? domReference : null,
    ].filter((x): x is Element => x != null);
  });

  createEffect(() => {
    if (disabled()) {
      return;
    }

    const floating = props.context.elements.floating();
    if (!floating) {
      return;
    }

    const cleanup =
      modal() || isUntrappedTypeableCombobox()
        ? markOthers(insideElements(), !useInert(), useInert())
        : markOthers(insideElements());

    onCleanup(() => {
      cleanup();
    });
  });

  createEffect(() => {
    const floatingElement = floatingFocusElement();
    if (disabled() || !floatingElement) {
      return;
    }

    const doc = getDocument(floatingElement);
    const previouslyFocusedElement = activeElement(doc);

    addPreviouslyFocusedElement(previouslyFocusedElement);

    props.context.events.on('openchange', onOpenChangeLocal);

    const domReference = props.context.elements.domReference();

    const fallbackEl = doc.createElement('span');
    fallbackEl.setAttribute('tabindex', '-1');
    fallbackEl.setAttribute('aria-hidden', 'true');
    Object.assign(fallbackEl.style, visuallyHidden);

    if (isInsidePortal() && domReference) {
      domReference.insertAdjacentElement('afterend', fallbackEl);
    }

    function getReturnElement() {
      const returnFocusValue = returnFocus();

      if (typeof returnFocusValue === 'boolean') {
        const el = domReference || getPreviouslyFocusedElement();
        return el && el.isConnected ? el : fallbackEl;
      }

      return returnFocusValue || fallbackEl;
    }

    onCleanup(() => {
      props.context.events.off('openchange', onOpenChangeLocal);

      const activeEl = activeElement(doc);
      const floating = props.context.elements.floating();

      const isFocusInsideFloatingTree =
        contains(floating, activeEl) ||
        (tree &&
          getNodeChildren(tree.nodesRef, getNodeId(), false).some((node) =>
            contains(node.context?.elements.floating(), activeEl),
          ));

      const returnElement = getReturnElement();
      // This is `returnElement`, if it's tabbable, or its first tabbable child.
      const tabbableReturnElement = getFirstTabbableElement(returnElement);
      const returnFocusValue = returnFocus();

      queueMicrotask(() => {
        if (
          returnFocusValue &&
          !preventReturnFocusRef &&
          isHTMLElement(tabbableReturnElement) &&
          // If the focus moved somewhere else after mount, avoid returning focus
          // since it likely entered a different element which should be
          // respected: https://github.com/floating-ui/floating-ui/issues/2607
          (tabbableReturnElement !== activeEl && activeEl !== doc.body
            ? isFocusInsideFloatingTree
            : true)
        ) {
          tabbableReturnElement.focus({ preventScroll: true });
        }

        fallbackEl.remove();
      });
    });
  });

  // Synchronize the `context` & `modal` value to the FloatingPortal context.
  // It will decide whether or not it needs to render its own guards.
  createEffect(() => {
    if (disabled()) {
      return;
    }
    if (!portalContext) {
      return;
    }

    portalContext.setFocusManagerState({
      modal: modal(),
      closeOnFocusOut: closeOnFocusOut(),
      open: props.context.open(),
      onOpenChange: props.context.onOpenChange,
      domReference: props.context.elements.domReference(),
    });

    onCleanup(() => {
      portalContext.setFocusManagerState(null);
    });
  });

  createEffect(() => {
    if (disabled()) {
      return;
    }

    const floatingElement = floatingFocusElement();
    if (!floatingElement) {
      return;
    }
    handleTabIndex(floatingElement, order());
  });

  function renderDismissButton(location: 'start' | 'end') {
    if (disabled() || !visuallyHiddenDismiss() || !modal()) {
      return null;
    }

    return (
      <VisuallyHiddenDismiss
        ref={location === 'start' ? setStartDismissButtonRef : setEndDismissButtonRef}
        onClick={(event) => props.context.onOpenChange(false, event)}
      >
        {typeof visuallyHiddenDismiss() === 'string' ? visuallyHiddenDismiss() : 'Dismiss'}
      </VisuallyHiddenDismiss>
    );
  }

  const shouldRenderGuards = () =>
    !disabled() &&
    guards() &&
    (modal() ? !isUntrappedTypeableCombobox() : true) &&
    (isInsidePortal() || modal());

  return (
    <>
      <Show when={shouldRenderGuards()}>
        <FocusGuard
          data-type="inside"
          ref={(el) => {
            setBeforeGuardRef(el);
            portalContext?.setBeforeInsideRef(el);
          }}
          onFocus={(event) => {
            if (modal()) {
              const els = getTabbableElements();
              enqueueFocus(order()[0] === 'reference' ? els[0] : els[els.length - 1]);
            } else if (portalContext?.preserveTabOrder() && portalContext.portalNode()) {
              preventReturnFocusRef = false;
              if (isOutsideEvent(event, portalContext.portalNode()!)) {
                const domReference = props.context.elements.domReference();
                const nextTabbable = getNextTabbable(domReference);
                nextTabbable?.focus();
              } else {
                portalContext.beforeOutsideRef()?.focus();
              }
            }
          }}
        />
      </Show>
      {/*
        Ensure the first swipe is the list item. The end of the listbox popup
        will have a dismiss button.
      */}
      <Show when={!isUntrappedTypeableCombobox()}>{renderDismissButton('start')}</Show>
      {props.children}
      {renderDismissButton('end')}
      <Show when={shouldRenderGuards()}>
        <FocusGuard
          data-type="inside"
          ref={(el) => {
            setAfterGuardRef(el);
            portalContext?.setAfterInsideRef(el);
          }}
          onFocus={(event) => {
            if (modal()) {
              enqueueFocus(getTabbableElements()[0]);
            } else if (portalContext?.preserveTabOrder() && portalContext.portalNode()) {
              if (closeOnFocusOut()) {
                preventReturnFocusRef = true;
              }

              if (isOutsideEvent(event, portalContext.portalNode()!)) {
                const domReference = props.context.elements.domReference();
                const prevTabbable = getPreviousTabbable(domReference);
                prevTabbable?.focus();
              } else {
                portalContext.afterOutsideRef()?.focus();
              }
            }
          }}
        />
      </Show>
    </>
  );
}
