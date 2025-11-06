'use client';
import { createMemo, splitProps, type JSX } from 'solid-js';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { FloatingEvents, useFloatingTree } from '../../floating-ui-solid';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
import { REGULAR_ITEM, useMenuItem } from '../item/useMenuItem';
import { useMenuRadioGroupContext } from '../radio-group/MenuRadioGroupContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { itemMapping } from '../utils/styleHookMapping';
import { MenuRadioItemContext } from './MenuRadioItemContext';

function InnerMenuRadioItem(componentProps: InnerMenuRadioItemProps) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'checked',
    'setChecked',
    'closeOnClick',
    'disabled',
    'highlighted',
    'id',
    'menuEvents',
    'itemProps',
    'render',
    'allowMouseUpTriggerRef',
    'typingRef',
    'nativeButton',
  ]);
  const checked = () => access(local.checked);
  const closeOnClick = () => access(local.closeOnClick);
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

  const state = createMemo<MenuRadioItem.State>(() => ({
    disabled: disabled(),
    highlighted: highlighted(),
    checked: checked(),
  }));

  return (
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
        state: state(),
        customStyleHookMapping: itemMapping,
        props: [
          itemProps(),
          {
            role: 'menuitemradio',
            'aria-checked': checked(),
            onClick: (event) => {
              local.setChecked(event);
            },
          },
          elementProps,
          getItemProps,
        ],
      }}
    />
  );
}

/**
 * A menu item that works like a radio button in a given group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuRadioItem(props: MenuRadioItem.Props) {
  const [local, other] = splitProps(props, [
    'id',
    'value',
    'label',
    'disabled',
    'closeOnClick',
    'nativeButton',
  ]);
  const idProp = () => access(local.id);
  const value = () => access(local.value);
  const label = () => access(local.label);
  const disabledProp = () => access(local.disabled) ?? false;
  const closeOnClick = () => access(local.closeOnClick) ?? false;
  const nativeButton = () => access(local.nativeButton) ?? false;

  let itemRef = null as HTMLElement | null | undefined;
  const listItem = useCompositeListItem({ label });

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const id = useBaseUiId(() => idProp());

  const highlighted = () => listItem.index() === activeIndex();
  const { events: menuEvents } = useFloatingTree()!;

  const {
    value: selectedValue,
    setValue: setSelectedValue,
    disabled: groupDisabled,
  } = useMenuRadioGroupContext();

  const disabled = () => groupDisabled() || disabledProp();

  // This wrapper component is used as a performance optimization.
  // MenuRadioItem reads the context and re-renders the actual MenuRadioItem
  // only when it needs to.

  const checked = () => selectedValue() === value();

  const setChecked = (event: Event) => {
    setSelectedValue(value(), event);
  };

  const contextValue = { checked, highlighted, disabled };

  return (
    <MenuRadioItemContext.Provider value={contextValue}>
      <InnerMenuRadioItem
        {...other}
        id={id()}
        ref={(el) => {
          if (typeof props.ref === 'function') {
            props.ref(el);
          } else {
            props.ref = el;
          }
          listItem.setRef(el);
          itemRef = el;
        }}
        disabled={disabled()}
        highlighted={highlighted()}
        menuEvents={menuEvents}
        itemProps={itemProps()}
        allowMouseUpTriggerRef={allowMouseUpTriggerRef()}
        checked={selectedValue() === value()}
        setChecked={setChecked}
        typingRef={typingRef()}
        closeOnClick={closeOnClick()}
        nativeButton={nativeButton()}
      />
    </MenuRadioItemContext.Provider>
  );
}

interface InnerMenuRadioItemProps extends Omit<MenuRadioItem.Props, 'value'> {
  highlighted: MaybeAccessor<boolean>;
  itemProps: MaybeAccessor<HTMLProps>;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: MaybeAccessor<boolean>;
  checked: MaybeAccessor<boolean>;
  setChecked: (event: Event) => void;
  typingRef: MaybeAccessor<boolean>;
  closeOnClick: MaybeAccessor<boolean>;
  nativeButton: MaybeAccessor<boolean>;
}

export namespace MenuRadioItem {
  export type State = {
    /**
     * Whether the radio item should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the radio item is currently highlighted.
     */
    highlighted: boolean;
    /**
     * Whether the radio item is currently selected.
     */
    checked: boolean;
  };

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
    /**
     * Value of the radio item.
     * This is the value that will be set in the MenuRadioGroup when the item is selected.
     */
    value: MaybeAccessor<any>;
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
