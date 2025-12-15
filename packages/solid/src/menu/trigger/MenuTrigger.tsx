'use client';
import { getParentNode, isHTMLElement, isLastTraversableNode } from '@floating-ui/utils/dom';
import { batch, createEffect, createMemo, Show, type JSX } from 'solid-js';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useFloatingTree } from '../../floating-ui-solid/index';
import { contains } from '../../floating-ui-solid/utils';
import { mergeProps } from '../../merge-props';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button/useButton';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { ownerDocument } from '../../utils/owner';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import { useMenuRootContext } from '../root/MenuRootContext';

const BOUNDARY_OFFSET = 2;

/**
 * A button that opens the menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuTrigger(componentProps: MenuTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const disabledProp = () => access(local.disabled) ?? false;
  const nativeButton = () => access(local.nativeButton) ?? true;

  const {
    triggerProps: rootTriggerProps,
    disabled: menuDisabled,
    setTriggerElement,
    open,
    parent,
    positionerRef,
    lastOpenChangeReason,
    rootId,
    setAllowMouseUpTriggerRef,
  } = useMenuRootContext();

  const disabled = () => disabledProp() || menuDisabled();

  let triggerRef = null as HTMLElement | null | undefined;
  const allowMouseUpTriggerTimeout = useTimeout();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const { events: menuEvents } = useFloatingTree()!;

  createEffect(() => {
    if (!open() && parent().type === undefined) {
      setAllowMouseUpTriggerRef(false);
    }
  });

  const handleDocumentMouseUp = (mouseEvent: MouseEvent) => {
    if (!triggerRef) {
      return;
    }

    allowMouseUpTriggerTimeout.clear();
    setAllowMouseUpTriggerRef(false);

    const mouseUpTarget = mouseEvent.target as Element | null;

    if (
      contains(triggerRef, mouseUpTarget) ||
      contains(positionerRef(), mouseUpTarget) ||
      mouseUpTarget === triggerRef
    ) {
      return;
    }

    if (mouseUpTarget != null && findRootOwnerId(mouseUpTarget) === rootId()) {
      return;
    }

    const bounds = getPseudoElementBounds(triggerRef);

    if (
      mouseEvent.clientX >= bounds.left - BOUNDARY_OFFSET &&
      mouseEvent.clientX <= bounds.right + BOUNDARY_OFFSET &&
      mouseEvent.clientY >= bounds.top - BOUNDARY_OFFSET &&
      mouseEvent.clientY <= bounds.bottom + BOUNDARY_OFFSET
    ) {
      return;
    }

    menuEvents.emit('close', { domEvent: mouseEvent, reason: 'cancel-open' });
  };

  createEffect(() => {
    if (open() && lastOpenChangeReason() === 'trigger-hover') {
      const doc = ownerDocument(triggerRef);
      doc.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
    }
  });

  const getTriggerProps = (externalProps?: HTMLProps): HTMLProps => {
    return mergeProps(
      {
        'aria-haspopup': 'menu' as const,
        onMouseDown: (event: MouseEvent) => {
          if (open()) {
            return;
          }

          // mousedown -> mouseup on menu item should not trigger it within 200ms.
          allowMouseUpTriggerTimeout.start(200, () => {
            setAllowMouseUpTriggerRef(true);
          });

          const doc = ownerDocument(event.currentTarget as Element);
          doc.addEventListener('mouseup', handleDocumentMouseUp, { once: true });
        },
      },
      externalProps,
      getButtonProps,
    );
  };

  const state = createMemo<MenuTrigger.State>(() => ({
    disabled: disabled(),
    open: open(),
  }));

  const element = useRenderElement('button', componentProps, {
    state,
    ref: (el) => {
      batch(() => {
        triggerRef = el;
        buttonRef(el);
        setTriggerElement(el);
      });
    },
    customStyleHookMapping: pressableTriggerOpenStateMapping,
    props: [rootTriggerProps, elementProps, getTriggerProps],
  });

  return (
    <Show when={parent().type === 'menubar'} fallback={element()}>
      <CompositeItem render={element} />
    </Show>
  );
}

export namespace MenuTrigger {
  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'disabled'> {
    children?: JSX.Element;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }

  export type State = {
    /**
     * Whether the menu is currently disabled.
     */
    disabled: boolean;
    /**
     * Whether the menu is currently open.
     */
    open: boolean;
  };
}

function findRootOwnerId(node: Node): string | undefined {
  if (isHTMLElement(node) && node.hasAttribute('data-rootownerid')) {
    return node.getAttribute('data-rootownerid') ?? undefined;
  }

  if (isLastTraversableNode(node)) {
    return undefined;
  }

  return findRootOwnerId(getParentNode(node));
}
