'use client';
import { createEffect, createMemo } from 'solid-js';
import { ACTIVE_COMPOSITE_ITEM } from '../../composite/constants';
import { useCompositeItem } from '../../composite/item/useCompositeItem';
import { splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { ownerDocument } from '../../utils/owner';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { useTabsListContext } from '../list/TabsListContext';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';

/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export function TabsTab(componentProps: TabsTab.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'value',
    'id',
    'nativeButton',
  ]);
  const disabled = () => local.disabled ?? false;
  const nativeButton = () => local.nativeButton ?? true;

  const {
    value: selectedTabValue,
    getTabPanelIdByTabValueOrIndex,
    orientation,
  } = useTabsRootContext();

  const { activateOnFocus, highlightedTabIndex, onTabActivation, setHighlightedTabIndex } =
    useTabsListContext();

  const id = useBaseUiId(() => local.id);

  const tabMetadata = createMemo(() => ({
    disabled: disabled(),
    id: id(),
    value: local.value,
  }));

  const {
    props: compositeItemProps,
    setRef: setCompositeItemRef,
    index,
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem({ metadata: tabMetadata });

  const tabValue = () => local.value ?? index();

  // the `selected` state isn't set on the server (it relies on effects to be calculated),
  // so we fall back to checking the `value` param with the selectedTabValue from the TabsContext
  const selected = createMemo(() => {
    if (local.value === undefined) {
      return index() < 0 ? false : index() === selectedTabValue();
    }

    return local.value === selectedTabValue();
  });

  let isNavigatingRef = false;

  // Keep the highlighted item in sync with the currently selected tab
  // when the value prop changes externally (controlled mode)
  createEffect(() => {
    if (isNavigatingRef) {
      isNavigatingRef = false;
      return;
    }

    if (selected() && index() > -1 && highlightedTabIndex() !== index()) {
      setHighlightedTabIndex(index());
    }
  });

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
    focusableWhenDisabled: true,
  });

  const tabPanelId = () =>
    index() > -1 ? getTabPanelIdByTabValueOrIndex(local.value, index()) : undefined;

  let isPressingRef = false;
  let isMainButtonRef = false;

  const onClick = (event: MouseEvent) => {
    if (selected() || disabled()) {
      return;
    }

    onTabActivation(tabValue(), event);
  };

  const onFocus = (event: FocusEvent) => {
    if (selected()) {
      return;
    }

    if (index() > -1) {
      setHighlightedTabIndex(index());
    }

    if (disabled()) {
      return;
    }

    if (
      (activateOnFocus() && !isPressingRef) || // keyboard focus
      (isPressingRef && isMainButtonRef) // focus caused by pointerdown
    ) {
      onTabActivation(tabValue(), event);
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (selected() || disabled()) {
      return;
    }

    isPressingRef = true;

    function handlePointerUp() {
      isPressingRef = false;
      isMainButtonRef = false;
    }

    if (!event.button || event.button === 0) {
      isMainButtonRef = true;

      const doc = ownerDocument(event.currentTarget as Element);
      doc.addEventListener('pointerup', handlePointerUp, { once: true });
    }
  };

  const state: TabsTab.State = {
    get disabled() {
      return disabled();
    },
    get selected() {
      return selected();
    },
    get orientation() {
      return orientation();
    },
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: (el) => {
      buttonRef(el);
      setCompositeItemRef(el);
    },
    props: [
      {
        role: 'tab',
        get 'aria-controls'() {
          return tabPanelId();
        },
        get 'aria-selected'() {
          return selected();
        },
        get id() {
          return id();
        },
        get [ACTIVE_COMPOSITE_ITEM as string]() {
          return selected() ? '' : undefined;
        },
        onClick,
        onFocus,
        onPointerDown,
        'on:keydown': {
          capture: true,
          handleEvent() {
            isNavigatingRef = true;
          },
        },
      },
      elementProps,
      getButtonProps,
      compositeItemProps,
    ],
  });

  return <>{element()}</>;
}

export namespace TabsTab {
  export type Value = any | null;

  export type ActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

  export interface Position {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  export interface Size {
    width: number;
    height: number;
  }

  export interface Metadata {
    disabled: boolean;
    id: string | undefined;
    value: any | undefined;
  }

  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    selected: boolean;
    orientation: TabsRoot.Orientation;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * The value of the Tab.
     * When not specified, the value is the child position index.
     * @type Tabs.Tab.Value
     */
    value?: Value;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
