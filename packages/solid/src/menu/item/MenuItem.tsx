'use client';
import { createMemo, splitProps, type JSX } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { FloatingEvents, useFloatingTree } from '../../floating-ui-solid';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { useMenuRootContext } from '../root/MenuRootContext';
import { REGULAR_ITEM, useMenuItem } from './useMenuItem';

function InnerMenuItem(componentProps: InnerMenuItemProps) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'closeOnClick',
    'disabled',
    'highlighted',
    'id',
    'menuEvents',
    'itemProps',
    'allowMouseUpTriggerRef',
    'typingRef',
    'nativeButton',
  ]);
  const closeOnClick = () => access(local.closeOnClick) ?? true;
  const disabled = () => access(local.disabled) ?? false;
  const highlighted = () => access(local.highlighted);
  const id = () => access(local.id);
  const itemProps = () => access(local.itemProps);
  const allowMouseUpTriggerRef = () => access(local.allowMouseUpTriggerRef);
  const typingRef = () => access(local.typingRef);
  const nativeButton = () => access(local.nativeButton);

  const { getItemProps, setItemRef } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    menuEvents: local.menuEvents,
    allowMouseUpTriggerRef,
    typingRef,
    nativeButton,
    itemMetadata: REGULAR_ITEM,
  });

  const state = createMemo<MenuItem.State>(() => ({
    disabled: disabled(),
    highlighted: highlighted(),
  }));

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setItemRef,
    props: [itemProps, elementProps, getItemProps],
  });

  return <>{element()}</>;
}

/**
 * An individual interactive item in the menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuItem(props: MenuItem.Props) {
  const [local, elementProps] = splitProps(props, ['id', 'label', 'nativeButton']);
  const idProp = () => access(local.id);
  const label = () => access(local.label);
  const nativeButton = () => access(local.nativeButton) ?? false;

  const listItem = useCompositeListItem({ label });

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const id = useBaseUiId(() => idProp());

  const highlighted = () => listItem.index() === activeIndex();
  const { events: menuEvents } = useFloatingTree()!;

  // This wrapper component is used as a performance optimization.
  // MenuItem reads the context and re-renders the actual MenuItem
  // only when it needs to.
  return (
    <InnerMenuItem
      {...elementProps}
      id={id()}
      ref={(el) => {
        if (typeof props.ref === 'function') {
          props.ref(el);
        } else {
          props.ref = el;
        }
        listItem.setRef(el);
      }}
      highlighted={highlighted()}
      menuEvents={menuEvents}
      itemProps={itemProps()}
      allowMouseUpTriggerRef={allowMouseUpTriggerRef()}
      typingRef={typingRef()}
      nativeButton={nativeButton()}
    />
  );
}

interface InnerMenuItemProps extends MenuItem.Props {
  highlighted: MaybeAccessor<boolean>;
  itemProps: MaybeAccessor<HTMLProps>;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: MaybeAccessor<boolean>;
  typingRef: MaybeAccessor<boolean>;
  nativeButton: MaybeAccessor<boolean>;
}

export namespace MenuItem {
  export interface State {
    /**
     * Whether the item should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the item is highlighted.
     */
    highlighted: boolean;
  }

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
    children?: JSX.Element;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Overrides the text label to use when the item is matched during keyboard text navigation.
     */
    label?: MaybeAccessor<string | undefined>;
    /**
     * @ignore
     */
    id?: MaybeAccessor<string | undefined>;
    /**
     * Whether to close the menu when the item is clicked.
     *
     * @default true
     */
    closeOnClick?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }
}
