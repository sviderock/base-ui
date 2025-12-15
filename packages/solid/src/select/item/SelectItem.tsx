'use client';
import { batch, createEffect, createMemo, onCleanup, type JSX } from 'solid-js';
import {
  IndexGuessBehavior,
  useCompositeListItem,
} from '../../composite/list/useCompositeListItem';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { isMouseWithinBounds } from '../../utils/isMouseWithinBounds';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSelectRootContext } from '../root/SelectRootContext';
import { SelectItemContext } from './SelectItemContext';

/**
 * An individual option in the select menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectItem(componentProps: SelectItem.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'value',
    'label',
    'disabled',
    'nativeButton',
  ]);
  const value = () => access(local.value) ?? null;
  const label = () => access(local.label);
  const disabled = () => access(local.disabled) ?? false;
  const nativeButton = () => access(local.nativeButton) ?? false;

  const refs: SelectItemContext['refs'] = {
    indexRef: 0,
    textRef: null,
  };

  let itemRef = null as HTMLElement | null | undefined;

  const listItem = useCompositeListItem({
    label,
    textRef: () => refs.textRef,
    indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
  });

  createEffect(() => {
    refs.indexRef = listItem.index();
  });

  const {
    store,
    setStore,
    selectors,
    getItemProps,
    setOpen,
    setValue,
    registerSelectedItem,
    highlightTimeout,
    refs: rootRefs,
  } = useSelectRootContext();

  const highlighted = () => selectors.isActive(listItem.index());
  const selected = () => selectors.isSelected([listItem.index(), value()]);
  const rootValue = () => store.value;

  const hasRegistered = () => listItem.index() !== -1;

  createEffect(() => {
    if (!hasRegistered()) {
      return;
    }

    const values = rootRefs.valuesRef;
    const idx = listItem.index();
    values[idx] = value();

    onCleanup(() => {
      delete values[idx];
    });
  });

  createEffect(() => {
    if (hasRegistered() && value() === rootValue()) {
      registerSelectedItem(listItem.index());
    }
  });

  const state = createMemo<SelectItem.State>(() => ({
    disabled: disabled(),
    selected: selected(),
    highlighted: highlighted(),
  }));

  const rootProps = createMemo(() => {
    const props = getItemProps({ active: highlighted(), selected: selected() });
    // With our custom `focusItemOnHover` implementation, this interferes with the logic and can
    // cause the index state to be stuck when leaving the select popup.
    delete props.onFocus;
    delete props.id;
    return props;
  });

  let lastKeyRef = null as string | null;
  let pointerTypeRef = 'mouse' as 'mouse' | 'touch' | 'pen';
  let didPointerDownRef = false;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  function commitSelection(event: MouseEvent) {
    batch(() => {
      setValue(value(), event);
      setOpen(false, event, 'item-press');
    });
  }

  const defaultProps = createMemo<HTMLProps>(() => ({
    'aria-disabled': disabled() || undefined,
    tabIndex: highlighted() ? 0 : -1,
    onFocus() {
      setStore('activeIndex', refs.indexRef);
    },
    onMouseEnter() {
      if (!rootRefs.keyboardActiveRef && store.selectedIndex === null) {
        setStore('activeIndex', refs.indexRef);
      }
    },
    onMouseMove() {
      setStore('activeIndex', refs.indexRef);
    },
    onMouseLeave(event) {
      if (rootRefs.keyboardActiveRef || isMouseWithinBounds(event)) {
        return;
      }

      highlightTimeout.start(0, () => {
        if (store.activeIndex === refs.indexRef) {
          setStore('activeIndex', null);
        }
      });
    },
    onTouchStart() {
      rootRefs.selectionRef = {
        allowSelectedMouseUp: false,
        allowUnselectedMouseUp: false,
        allowSelect: true,
      };
    },
    onKeyDown(event) {
      rootRefs.selectionRef.allowSelect = true;
      lastKeyRef = event.key;
      setStore('activeIndex', refs.indexRef);
    },
    onClick(event) {
      didPointerDownRef = false;

      // Prevent double commit on {Enter}
      if (event.type === 'keydown' && lastKeyRef === null) {
        return;
      }

      if (
        disabled() ||
        (lastKeyRef === ' ' && rootRefs.typingRef) ||
        (pointerTypeRef !== 'touch' && !highlighted())
      ) {
        return;
      }

      if (rootRefs.selectionRef.allowSelect) {
        lastKeyRef = null;
        commitSelection(event);
      }
    },
    onPointerEnter(event) {
      pointerTypeRef = event.pointerType as 'mouse' | 'touch' | 'pen';
    },
    onPointerDown(event) {
      pointerTypeRef = event.pointerType as 'mouse' | 'touch' | 'pen';
      didPointerDownRef = true;
    },
    onMouseUp(event) {
      if (disabled()) {
        return;
      }

      if (didPointerDownRef) {
        didPointerDownRef = false;
        return;
      }

      const disallowSelectedMouseUp = !rootRefs.selectionRef.allowSelectedMouseUp && selected();
      const disallowUnselectedMouseUp =
        !rootRefs.selectionRef.allowUnselectedMouseUp && !selected();

      if (
        disallowSelectedMouseUp ||
        disallowUnselectedMouseUp ||
        (pointerTypeRef !== 'touch' && !highlighted())
      ) {
        return;
      }

      if (rootRefs.selectionRef.allowSelect || !selected()) {
        commitSelection(event);
      }

      rootRefs.selectionRef.allowSelect = true;
    },
  }));

  const contextValue: SelectItemContext = {
    selected,
    refs,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      batch(() => {
        buttonRef(el);
        listItem.setRef(el);
        itemRef = el;
      });
    },
    props: [rootProps, defaultProps, elementProps, getButtonProps],
  });

  return <SelectItemContext.Provider value={contextValue}>{element()}</SelectItemContext.Provider>;
}

export namespace SelectItem {
  export interface State {
    /**
     * Whether the item should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the item is selected.
     */
    selected: boolean;
    /**
     * Whether the item is highlighted.
     */
    highlighted: boolean;
  }

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
    children?: JSX.Element;
    /**
     * A unique value that identifies this select item.
     * @default null
     */
    value?: MaybeAccessor<any | undefined>;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Overrides the text label to use on the trigger when this item is selected
     * and when the item is matched during keyboard text navigation.
     */
    label?: MaybeAccessor<string | undefined>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }
}
