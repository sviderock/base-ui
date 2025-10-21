'use client';
import { batch, createEffect, createMemo } from 'solid-js';
import { ACTIVE_COMPOSITE_ITEM } from '../../composite/constants';
import { useCompositeItem } from '../../composite/item/useCompositeItem';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { ownerDocument } from '../../utils/owner';
import type { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
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
  const disabled = () => access(local.disabled) ?? false;
  const valueProp = () => access(local.value);
  const idProp = () => access(local.id);
  const nativeButton = () => access(local.nativeButton) ?? true;

  const {
    value: selectedTabValue,
    getTabPanelIdByTabValueOrIndex,
    orientation,
  } = useTabsRootContext();

  const { activateOnFocus, highlightedTabIndex, onTabActivation, setHighlightedTabIndex } =
    useTabsListContext();

  const id = useBaseUiId(idProp);

  const tabMetadata = createMemo(() => ({
    disabled: disabled(),
    id: id(),
    value: valueProp(),
  }));

  const {
    props: compositeItemProps,
    setRef: setCompositeItemRef,
    index,
    // hook is used instead of the CompositeItem component
    // because the index is needed for Tab internals
  } = useCompositeItem({ metadata: tabMetadata });

  const tabValue = () => valueProp() ?? index();

  // the `selected` state isn't set on the server (it relies on effects to be calculated),
  // so we fall back to checking the `value` param with the selectedTabValue from the TabsContext
  const selected = createMemo(() => {
    if (valueProp() === undefined) {
      return index() < 0 ? false : index() === selectedTabValue();
    }

    return valueProp() === selectedTabValue();
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
    index() > -1 ? getTabPanelIdByTabValueOrIndex(valueProp(), index()) : undefined;

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

  const state = createMemo<TabsTab.State>(() => ({
    disabled: disabled(),
    selected: selected(),
    orientation: orientation(),
  }));

  return (
    <RenderElement
      element="button"
      componentProps={componentProps}
      ref={(el) => {
        batch(() => {
          buttonRef(el);
          setCompositeItemRef(el);
          if (typeof componentProps.ref === 'function') {
            componentProps.ref(el);
          } else {
            componentProps.ref = el;
          }
        });
      }}
      params={{
        state: state(),
        props: [
          {
            role: 'tab',
            'aria-controls': tabPanelId(),
            'aria-selected': selected(),
            id: id(),
            onClick,
            onFocus,
            onPointerDown,
            [ACTIVE_COMPOSITE_ITEM as string]: selected() ? '' : undefined,
            'on:keydown': {
              capture: true,
              handleEvent() {
                isNavigatingRef = true;
              },
            },
          },
          elementProps,
          getButtonProps,
          compositeItemProps(),
        ],
      }}
    />
  );
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
    value?: MaybeAccessor<Value | undefined>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }
}
