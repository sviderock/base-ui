import { isHTMLElement } from '@floating-ui/utils/dom';
import { batch, createMemo, createSignal, Show, splitProps } from 'solid-js';
import {
  FloatingTree,
  useFloatingNodeId,
  useFloatingParentNodeId,
  type FloatingRootContext,
} from '../../floating-ui-solid';
import { activeElement, contains } from '../../floating-ui-solid/utils';
import { access, splitComponentProps } from '../../solid-helpers';
import { useControlled, useTransitionStatus } from '../../utils';
import { ownerDocument } from '../../utils/owner';
import type { BaseOpenChangeReason } from '../../utils/translateOpenChangeReason';
import type { BaseUIComponentProps } from '../../utils/types';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  NavigationMenuRootContext,
  NavigationMenuTreeContext,
  useNavigationMenuRootContext,
} from './NavigationMenuRootContext';

/**
 * Groups all parts of the navigation menu.
 * Renders a `<nav>` element at the root, or `<div>` element when nested.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export function NavigationMenuRoot(componentProps: NavigationMenuRoot.Props) {
  const [local] = splitProps(componentProps, [
    'defaultValue',
    'value',
    'onValueChange',
    'actionsRef',
    'delay',
    'closeDelay',
    'orientation',
    'onOpenChangeComplete',
  ]);
  const defaultValue = () => local.defaultValue ?? null;
  const delay = () => local.delay ?? 50;
  const closeDelay = () => local.closeDelay ?? 50;
  const orientation = () => local.orientation ?? 'horizontal';

  const nested = () => useFloatingParentNodeId() != null;

  const [value, setValueUnwrapped] = useControlled({
    controlled: () => local.value,
    default: defaultValue,
    name: 'NavigationMenu',
    state: 'value',
  });

  // Derive open state from value being non-nullish
  const open = createMemo(() => value() != null);

  let closeReasonRef: BaseOpenChangeReason | undefined;

  const [positionerElement, setPositionerElement] = createSignal<HTMLElement | null | undefined>(
    null,
  );
  const [popupElement, setPopupElement] = createSignal<HTMLElement | null | undefined>(null);
  const [viewportElement, setViewportElement] = createSignal<HTMLElement | null | undefined>(null);
  const [activationDirection, setActivationDirection] =
    createSignal<ReturnType<NavigationMenuRootContext['setActivationDirection']>>(null);
  const [floatingRootContext, setFloatingRootContext] = createSignal<FloatingRootContext>();

  const refs: NavigationMenuRootContext['refs'] = {
    currentContentRef: null,
    rootRef: null,
    beforeInsideRef: null,
    afterInsideRef: null,
    beforeOutsideRef: null,
    afterOutsideRef: null,
    prevTriggerElementRef: null,
  };

  const { transitionStatus, setMounted, mounted } = useTransitionStatus(() => open());

  const setValue = (
    nextValue: any,
    event: Event | undefined,
    reason: BaseOpenChangeReason | undefined,
  ) => {
    batch(() => {
      if (!nextValue) {
        closeReasonRef = reason;
        setActivationDirection(null);
        setFloatingRootContext(undefined);
      }

      if (nextValue !== value()) {
        local.onValueChange?.(nextValue, event, reason);
      }

      setValueUnwrapped(nextValue);
    });
  };

  const handleUnmount = () => {
    const doc = ownerDocument(refs.rootRef);
    const activeEl = activeElement(doc);

    if (
      closeReasonRef !== 'trigger-hover' &&
      isHTMLElement(refs.prevTriggerElementRef) &&
      (contains(popupElement(), activeEl) || activeEl === doc.body)
    ) {
      refs.prevTriggerElementRef.focus({ preventScroll: true });
      refs.prevTriggerElementRef = undefined;
    }
    batch(() => {
      setMounted(false);
      local.onOpenChangeComplete?.(false);
      setActivationDirection(null);
      setFloatingRootContext(undefined);
    });
    refs.currentContentRef = null;
    closeReasonRef = undefined;
  };

  useOpenChangeComplete({
    enabled: () => !local.actionsRef,
    open,
    ref: popupElement,
    onComplete() {
      if (!open()) {
        handleUnmount();
      }
    },
  });

  const contextValue: NavigationMenuRootContext = {
    open,
    value,
    setValue,
    mounted,
    transitionStatus,
    positionerElement,
    setPositionerElement,
    popupElement,
    setPopupElement,
    viewportElement,
    setViewportElement,
    activationDirection,
    setActivationDirection,
    floatingRootContext,
    setFloatingRootContext,
    nested,
    refs,
    delay,
    closeDelay,
    orientation,
  };

  const element = () => (
    <NavigationMenuRootContext.Provider value={contextValue}>
      <TreeContext {...componentProps} />
    </NavigationMenuRootContext.Provider>
  );

  return (
    <Show when={nested()} fallback={<FloatingTree>{element()}</FloatingTree>}>
      {element()}
    </Show>
  );
}

function TreeContext(componentProps: NavigationMenuRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'defaultValue',
    'value',
    'onValueChange',
    'actionsRef',
    'delay',
    'closeDelay',
    'orientation',
    'onOpenChangeComplete',
  ]);

  const nodeId = useFloatingNodeId();

  const { refs, nested } = useNavigationMenuRootContext();

  const { open } = useNavigationMenuRootContext();

  const state: NavigationMenuRoot.State = {
    get open() {
      return open();
    },
    get nested() {
      return nested();
    },
  };

  const element = useRenderElement(() => (nested() ? 'div' : 'nav'), componentProps, {
    state,
    ref: (el: any) => {
      refs.rootRef = el;
    },
    props: [
      {
        get 'aria-orientation'() {
          return local.orientation;
        },
      },
      elementProps,
    ],
  });

  return (
    <NavigationMenuTreeContext.Provider value={nodeId}>
      {element()}
    </NavigationMenuTreeContext.Provider>
  );
}

export namespace NavigationMenuRoot {
  export interface State {
    /**
     * If `true`, the popup is open.
     */
    open: boolean;
    /**
     * Whether the navigation menu is nested.
     */
    nested: boolean;
  }

  export interface Props extends BaseUIComponentProps<'nav', State> {
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the navigation menu will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the navigation menu manually.
     * Useful when the navigation menu's animation is controlled by an external library.
     */
    actionsRef?: { unmount: () => void };
    /**
     * Event handler called after any animations complete when the navigation menu is closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * The controlled value of the navigation menu item that should be currently open.
     * When non-nullish, the menu will be open. When nullish, the menu will be closed.
     *
     * To render an uncontrolled navigation menu, use the `defaultValue` prop instead.
     * @default null
     */
    value?: any;
    /**
     * The uncontrolled value of the item that should be initially selected.
     *
     * To render a controlled navigation menu, use the `value` prop instead.
     * @default null
     */
    defaultValue?: any;
    /**
     * Callback fired when the value changes.
     */
    onValueChange?: (
      value: any,
      event: Event | undefined,
      reason: BaseOpenChangeReason | undefined,
    ) => void;
    /**
     * How long to wait before opening the navigation menu. Specified in milliseconds.
     * @default 50
     */
    delay?: number;
    /**
     * How long to wait before closing the navigation menu. Specified in milliseconds.
     * @default 50
     */
    closeDelay?: number;
    /**
     * The orientation of the navigation menu.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical';
  }
}
