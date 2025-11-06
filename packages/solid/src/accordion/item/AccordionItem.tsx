'use client';
import { batch, createMemo, createSignal } from 'solid-js';
import type { CollapsibleRoot } from '../../collapsible/root/CollapsibleRoot';
import { CollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCollapsibleRoot } from '../../collapsible/root/useCollapsibleRoot';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { type MaybeAccessor, access, splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { RenderElement } from '../../utils/useRenderElement';
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
  const disabledProp = () => access(local.disabled) ?? false;
  const valueProp = () => access(local.value);

  const { setRef: setListItemRef, index } = useCompositeListItem();

  const {
    disabled: contextDisabled,
    handleValueChange,
    state: rootState,
    value: openValues,
  } = useAccordionRootContext();

  const value = () => valueProp() ?? index();

  const disabled = () => disabledProp() || contextDisabled();

  const isOpen = createMemo(() => {
    if (!openValues()) {
      return false;
    }

    for (let i = 0; i < openValues().length; i += 1) {
      if (openValues()[i] === value()) {
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

  const collapsibleState = createMemo<CollapsibleRoot.State>(() => ({
    open: collapsible.open(),
    disabled: collapsible.disabled(),
    hidden: !collapsible.mounted(),
    transitionStatus: collapsible.transitionStatus(),
  }));

  const collapsibleContext: CollapsibleRootContext = {
    ...collapsible,
    onOpenChange,
    state: collapsibleState,
    transitionStatus: collapsible.transitionStatus,
  };

  const state = createMemo<AccordionItem.State>(() => ({
    ...rootState(),
    index: index(),
    disabled: disabled(),
    open: isOpen(),
  }));

  const initialTriggerId = useBaseUiId();
  const [triggerId, setTriggerId] = createSignal<string | undefined>(initialTriggerId());

  const accordionItemContext: AccordionItemContext = {
    open: isOpen,
    state,
    setTriggerId,
    triggerId,
  };

  return (
    <CollapsibleRootContext.Provider value={collapsibleContext}>
      <AccordionItemContext.Provider value={accordionItemContext}>
        <RenderElement
          element="div"
          componentProps={componentProps}
          ref={(el) => {
            if (typeof componentProps.ref === 'function') {
              componentProps.ref(el);
            } else {
              componentProps.ref = el;
            }
            setListItemRef(el);
          }}
          params={{
            state: state(),
            props: elementProps,
            customStyleHookMapping: accordionStyleHookMapping,
          }}
        />
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

  export interface Props
    extends BaseUIComponentProps<'div', State>,
      Partial<Pick<useCollapsibleRoot.Parameters, 'disabled' | 'onOpenChange'>> {
    value?: MaybeAccessor<AccordionItemValue | undefined>;
  }
}
