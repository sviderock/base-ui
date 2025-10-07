'use client';
import { splitProps, type Accessor, type JSX } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { FloatingEvents, useFloatingTree } from '../../floating-ui-solid';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { RenderElement } from '../../utils/useRenderElement';
import { REGULAR_ITEM, useMenuItem } from '../item/useMenuItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { itemMapping } from '../utils/styleHookMapping';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';

function InnerMenuCheckboxItem(componentProps: InnerMenuCheckboxItemProps) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'checked',
    'defaultChecked',
    'onCheckedChange',
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
  const checkedProp = () => access(local.checked);
  const defaultChecked = () => access(local.defaultChecked);
  const closeOnClick = () => access(local.closeOnClick);
  const disabled = () => access(local.disabled) ?? false;
  const highlighted = () => access(local.highlighted);
  const id = () => access(local.id);
  const itemProps = () => access(local.itemProps);
  const allowMouseUpTriggerRef = () => access(local.allowMouseUpTriggerRef);
  const typingRef = () => access(local.typingRef);
  const nativeButton = () => access(local.nativeButton);

  const [checked, setChecked] = useControlled({
    controlled: checkedProp,
    default: () => defaultChecked() ?? false,
    name: 'MenuCheckboxItem',
    state: 'checked',
  });

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

  const state: MenuCheckboxItem.State = { disabled, highlighted, checked };

  return (
    <MenuCheckboxItemContext.Provider value={state}>
      <RenderElement
        element="div"
        componentProps={componentProps}
        ref={(el) => {
          setItemRef(el);
          if (typeof componentProps.ref === 'function') {
            componentProps.ref(el);
          } else {
            componentProps.ref = el;
          }
        }}
        params={{
          state,
          customStyleHookMapping: itemMapping,
          props: [
            itemProps(),
            {
              role: 'menuitemcheckbox',
              'aria-checked': checked(),
              onClick: (event) => {
                setChecked((currentlyChecked) => !currentlyChecked);
                local.onCheckedChange?.(checked(), event);
              },
            },
            elementProps,
            getItemProps,
          ],
        }}
      />
    </MenuCheckboxItemContext.Provider>
  );
}

/**
 * A menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuCheckboxItem(props: MenuCheckboxItem.Props) {
  const [local, other] = splitProps(props, ['id', 'label', 'closeOnClick', 'nativeButton']);
  const idProp = () => access(local.id);
  const label = () => access(local.label);
  const closeOnClick = () => access(local.closeOnClick) ?? false;
  const nativeButton = () => access(local.nativeButton) ?? false;

  let itemRef = null as HTMLElement | null | undefined;
  const listItem = useCompositeListItem({ label });

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const id = useBaseUiId(() => idProp());

  const highlighted = () => listItem.index() === activeIndex();
  const { events: menuEvents } = useFloatingTree()!;

  // This wrapper component is used as a performance optimization.
  // MenuCheckboxItem reads the context and re-renders the actual MenuCheckboxItem
  // only when it needs to.

  return (
    <InnerMenuCheckboxItem
      {...other}
      id={id()}
      ref={(el) => {
        itemRef = el;
        listItem.setRef(el);
        if (typeof props.ref === 'function') {
          props.ref(el);
        } else {
          props.ref = el;
        }
      }}
      highlighted={highlighted()}
      menuEvents={menuEvents}
      itemProps={itemProps()}
      allowMouseUpTriggerRef={allowMouseUpTriggerRef()}
      typingRef={typingRef()}
      closeOnClick={closeOnClick()}
      nativeButton={nativeButton()}
    />
  );
}

interface InnerMenuCheckboxItemProps extends MenuCheckboxItem.Props {
  highlighted: MaybeAccessor<boolean>;
  itemProps: MaybeAccessor<HTMLProps>;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: MaybeAccessor<boolean>;
  typingRef: MaybeAccessor<boolean>;
  closeOnClick: MaybeAccessor<boolean>;
  nativeButton: MaybeAccessor<boolean>;
}

export namespace MenuCheckboxItem {
  export type State = {
    /**
     * Whether the checkbox item should ignore user interaction.
     */
    disabled: Accessor<boolean>;
    /**
     * Whether the checkbox item is currently highlighted.
     */
    highlighted: Accessor<boolean>;
    /**
     * Whether the checkbox item is currently ticked.
     */
    checked: Accessor<boolean>;
  };

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
    /**
     * Whether the checkbox item is currently ticked.
     *
     * To render an uncontrolled checkbox item, use the `defaultChecked` prop instead.
     */
    checked?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the checkbox item is initially ticked.
     *
     * To render a controlled checkbox item, use the `checked` prop instead.
     * @default false
     */
    defaultChecked?: MaybeAccessor<boolean | undefined>;
    /**
     * Event handler called when the checkbox item is ticked or unticked.
     */
    onCheckedChange?: (checked: boolean, event: Event) => void;
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
     * @default false
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
