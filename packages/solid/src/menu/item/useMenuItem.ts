'use client';
import type { Accessor } from 'solid-js';
import { FloatingEvents } from '../../floating-ui-solid';
import { combineProps } from '../../merge-props';
import { access, MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { BaseUIEvent, type BaseUIHTMLProps, type HTMLProps } from '../../utils/types';

export const REGULAR_ITEM = {
  type: 'regular-item' as const,
};

export function useMenuItem(params: useMenuItem.Parameters): useMenuItem.ReturnValue {
  const closeOnClick = () => access(params.closeOnClick);
  const disabled = () => access(params.disabled) ?? false;
  const highlighted = () => access(params.highlighted);
  const id = () => access(params.id);
  const allowMouseUpTriggerRef = () => access(params.allowMouseUpTriggerRef);
  const typingRef = () => access(params.typingRef);
  const nativeButton = () => access(params.nativeButton);

  let itemRef = null as HTMLElement | null | undefined;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const getItemProps = (externalProps: HTMLProps | BaseUIHTMLProps = {}) => {
    return combineProps([
      {
        role: 'menuitem',
        get id() {
          return id();
        },
        get tabIndex() {
          return highlighted() ? 0 : -1;
        },
        onMouseEnter() {
          const metadata = params.itemMetadata;
          if (metadata.type !== 'submenu-trigger') {
            return;
          }

          metadata.setActive();
        },
        onKeyUp: (event: BaseUIEvent<KeyboardEvent>) => {
          if (event.key === ' ' && typingRef()) {
            event.preventBaseUIHandler();
          }
        },
        /**
         * TODO: this is needed in order to propagate the keydown event to the button
         * (for example, test MenuRadioItem#L162-L190 for "Enter" key)
         */
        onKeyDown: () => {},
        onClick: (event: MouseEvent | KeyboardEvent) => {
          if (closeOnClick()) {
            params.menuEvents.emit('close', { domEvent: event, reason: 'item-press' });
          }
        },
        onMouseUp: () => {
          if (itemRef && allowMouseUpTriggerRef()) {
            // This fires whenever the user clicks on the trigger, moves the cursor, and releases it over the item.
            // We trigger the click and override the `closeOnClick` preference to always close the menu.
            if (params.itemMetadata.type === 'regular-item') {
              itemRef.click();
            }
          }
        },
      },
      externalProps,
      getButtonProps,
    ]);
  };

  return {
    getItemProps,
    setItemRef: (el) => {
      itemRef = el;
      buttonRef(el);
    },
  };
}

export namespace useMenuItem {
  export interface Parameters {
    /**
     * Whether to close the menu when the item is clicked.
     */
    closeOnClick: MaybeAccessor<boolean>;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: MaybeAccessor<boolean>;
    /**
     * Determines if the menu item is highlighted.
     */
    highlighted: MaybeAccessor<boolean>;
    /**
     * The id of the menu item.
     */
    id: MaybeAccessor<string | undefined>;
    /**
     * The FloatingEvents instance of the menu's root.
     */
    menuEvents: FloatingEvents;
    /**
     * Whether to treat mouseup events as clicks.
     */
    allowMouseUpTriggerRef: Accessor<boolean>;
    /**
     * A ref that is set to `true` when the user is using the typeahead feature.
     */
    typingRef: Accessor<boolean>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton: MaybeAccessor<boolean>;
    /**
     * Additional data specific to the item type.
     */
    itemMetadata: Metadata;
  }

  export type Metadata =
    | typeof REGULAR_ITEM
    | {
        type: 'submenu-trigger';
        setActive: () => void;
        allowMouseEnterEnabled: boolean;
      };

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps event handlers for the root slot
     * @returns props that should be spread on the root slot
     */
    getItemProps: (externalProps?: BaseUIHTMLProps) => BaseUIHTMLProps;
    /**
     * The ref to the component's root DOM element.
     */
    setItemRef: (el: HTMLElement | null | undefined) => void;
  }
}
