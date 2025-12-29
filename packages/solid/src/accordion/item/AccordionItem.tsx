'use client';
import { batch, createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js';
import { createStore } from 'solid-js/store';
import { CollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCollapsibleRoot } from '../../collapsible/root/useCollapsibleRoot';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { type CodependentRefs, splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import type { AccordionRoot } from '../root/AccordionRoot';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import { AccordionItemContext } from './AccordionItemContext';
import { accordionStyleHookMapping } from './styleHooks';

/**
 * Groups an accordion header with the corresponding panel.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/solid/components/accordion)
 */
export function AccordionItem(componentProps: AccordionItem.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'onOpenChange',
    'value',
  ]);

  const { setRef: setListItemRef, index } = useCompositeListItem();

  const {
    disabled: contextDisabled,
    handleValueChange,
    state: rootState,
    value: openValues,
  } = useAccordionRootContext();

  const value = () => local.value ?? index();

  const disabled = () => (local.disabled ?? false) || contextDisabled();

  const isOpen = createMemo(() => {
    const values = openValues();
    if (!values) {
      return false;
    }

    for (let i = 0; i < values.length; i += 1) {
      if (values[i] === value()) {
        return true;
      }
    }

    return false;
  });

  const onOpenChange = (nextOpen: boolean) => {
    batch(() => {
      handleValueChange(value(), nextOpen);
      local.onOpenChange?.(nextOpen);
    });
  };

  const collapsible = useCollapsibleRoot({
    open: isOpen,
    onOpenChange,
    disabled,
  });

  const collapsibleState = {
    get open() {
      return collapsible.open();
    },
    get disabled() {
      return collapsible.disabled();
    },
    get hidden() {
      return !collapsible.mounted();
    },
    get transitionStatus() {
      return collapsible.transitionStatus();
    },
  };

  const collapsibleContext: CollapsibleRootContext = mergeProps(collapsible, {
    onOpenChange,
    state: collapsibleState,
    transitionStatus: collapsible.transitionStatus,
  });

  const state: AccordionItem.State = mergeProps(rootState, {
    get index() {
      return index();
    },
    get disabled() {
      return disabled();
    },
    get open() {
      return isOpen();
    },
  });

  const initialTriggerId = useBaseUiId();
  const [triggerId, setTriggerId] = createSignal<string | undefined>(initialTriggerId());
  const [codependentRefs, setCodependentRefs] = createStore<CodependentRefs<['trigger']>>({});

  createEffect(
    on(
      () => codependentRefs.trigger,
      (trigger) => {
        if (trigger) {
          setTriggerId(trigger.id() ?? trigger.explicitId());
        }
      },
    ),
  );

  const accordionItemContext: AccordionItemContext = {
    open: isOpen,
    state,
    triggerId,
    codependentRefs,
    setCodependentRefs,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: setListItemRef,
    props: elementProps,
    customStyleHookMapping: accordionStyleHookMapping,
  });

  return (
    <CollapsibleRootContext.Provider value={collapsibleContext}>
      <AccordionItemContext.Provider value={accordionItemContext}>
        {element()}
      </AccordionItemContext.Provider>
    </CollapsibleRootContext.Provider>
  );
}

export type AccordionItemValue = any | null;

export namespace AccordionItem {
  export interface State extends AccordionRoot.State {
    index: number;
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    value?: AccordionItemValue;
    /**
     * Event handler called when the panel is opened or closed.
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
