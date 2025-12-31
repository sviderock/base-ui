import { createEffect, createMemo } from 'solid-js';
import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  END,
  HOME,
  stopEvent,
} from '../../composite/composite';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { access, splitComponentProps } from '../../solid-helpers';
import { isElementDisabled } from '../../utils/isElementDisabled';
import { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useControlled } from '../../utils/useControlled';
import { useRenderElement } from '../../utils/useRenderElement';
import { warn } from '../../utils/warn';
import { AccordionRootContext } from './AccordionRootContext';

const SUPPORTED_KEYS = new Set([ARROW_DOWN, ARROW_UP, ARROW_RIGHT, ARROW_LEFT, HOME, END]);

const rootStyleHookMapping = {
  value: () => null,
};

function getActiveTriggers(
  accordionItemElements: (HTMLElement | null | undefined)[],
): HTMLButtonElement[] {
  const output: HTMLButtonElement[] = [];

  for (let i = 0; i < accordionItemElements.length; i += 1) {
    const section = accordionItemElements[i];
    if (!isElementDisabled(section)) {
      const trigger = section?.querySelector('[type="button"]') as HTMLButtonElement;
      if (!isElementDisabled(trigger)) {
        output.push(trigger);
      }
    }
  }

  return output;
}

/**
 * Groups all parts of the accordion.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export function AccordionRoot(componentProps: AccordionRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'hiddenUntilFound',
    'keepMounted',
    'loop',
    'onValueChange',
    'openMultiple',
    'orientation',
    'value',
    'defaultValue',
  ]);
  const disabled = () => access(local.disabled) ?? false;
  const loop = () => access(local.loop) ?? true;
  const openMultiple = () => access(local.openMultiple) ?? true;
  const orientation = () => access(local.orientation) ?? 'vertical';

  const direction = useDirection();

  if (process.env.NODE_ENV !== 'production') {
    createEffect(() => {
      if (local.hiddenUntilFound && local.keepMounted === false) {
        warn(
          'The `keepMounted={false}` prop on a Accordion.Root will be ignored when using `hiddenUntilFound` since it requires Panels to remain mounted when closed.',
        );
      }
    });
  }

  // memoized to allow omitting both defaultValue and value
  // which would otherwise trigger a warning in useControlled
  const defaultValue = createMemo(() => {
    if (local.value === undefined) {
      return local.defaultValue ?? [];
    }

    return undefined;
  });

  const accordionItemElements: (HTMLElement | null | undefined)[] = [];

  const [value, setValue] = useControlled({
    controlled: () => local.value,
    default: defaultValue,
    name: 'Accordion',
    state: 'value',
  });

  const handleValueChange = (newValue: number | string, nextOpen: boolean) => {
    if (!openMultiple()) {
      const nextValue = value()?.[0] === newValue ? [] : [newValue];
      setValue(nextValue);
      local.onValueChange?.(nextValue);
    } else if (nextOpen) {
      const nextOpenValues = value()?.slice();
      nextOpenValues.push(newValue);
      setValue(nextOpenValues);
      local.onValueChange?.(nextOpenValues);
    } else {
      const nextOpenValues = value()?.filter((v) => v !== newValue);
      setValue(nextOpenValues);
      local.onValueChange?.(nextOpenValues);
    }
  };

  const isRtl = () => direction() === 'rtl';
  const isHorizontal = () => orientation() === 'horizontal';

  const state: AccordionRoot.State = {
    get value() {
      return value();
    },
    get disabled() {
      return disabled();
    },
    get orientation() {
      return orientation();
    },
  };

  const contextValue: AccordionRootContext = {
    accordionItemElements,
    direction,
    disabled,
    handleValueChange,
    hiddenUntilFound: () => local.hiddenUntilFound ?? false,
    keepMounted: () => local.keepMounted ?? false,
    orientation,
    state,
    value,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: [
      {
        get dir() {
          return direction();
        },
        get role() {
          return 'region' as const;
        },
        onKeyDown(event) {
          if (!SUPPORTED_KEYS.has(event.key)) {
            return;
          }

          stopEvent(event);

          const triggers = getActiveTriggers(accordionItemElements);

          const numOfEnabledTriggers = triggers.length;
          const lastIndex = numOfEnabledTriggers - 1;

          let nextIndex = -1;

          const thisIndex = triggers.indexOf(event.target as HTMLButtonElement);

          function toNext() {
            if (loop()) {
              nextIndex = thisIndex + 1 > lastIndex ? 0 : thisIndex + 1;
            } else {
              nextIndex = Math.min(thisIndex + 1, lastIndex);
            }
          }

          function toPrev() {
            if (loop()) {
              nextIndex = thisIndex === 0 ? lastIndex : thisIndex - 1;
            } else {
              nextIndex = thisIndex - 1;
            }
          }

          switch (event.key) {
            case ARROW_DOWN:
              if (!isHorizontal()) {
                toNext();
              }
              break;
            case ARROW_UP:
              if (!isHorizontal()) {
                toPrev();
              }
              break;
            case ARROW_RIGHT:
              if (isHorizontal()) {
                if (isRtl()) {
                  toPrev();
                } else {
                  toNext();
                }
              }
              break;
            case ARROW_LEFT:
              if (isHorizontal()) {
                if (isRtl()) {
                  toNext();
                } else {
                  toPrev();
                }
              }
              break;
            case 'Home':
              nextIndex = 0;
              break;
            case 'End':
              nextIndex = lastIndex;
              break;
            default:
              break;
          }

          if (nextIndex > -1) {
            triggers[nextIndex].focus();
          }
        },
      },
      elementProps,
    ],
    customStyleHookMapping: rootStyleHookMapping,
  });

  return (
    <AccordionRootContext.Provider value={contextValue}>
      <CompositeList refs={{ elements: accordionItemElements }}>{element()}</CompositeList>
    </AccordionRootContext.Provider>
  );
}

export type AccordionValue = (any | null)[];

export namespace AccordionRoot {
  export interface State {
    value: AccordionValue;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    orientation: Orientation;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The controlled value of the item(s) that should be expanded.
     *
     * To render an uncontrolled accordion, use the `defaultValue` prop instead.
     */
    value?: AccordionValue;
    /**
     * The uncontrolled value of the item(s) that should be initially expanded.
     *
     * To render a controlled accordion, use the `value` prop instead.
     */
    defaultValue?: AccordionValue;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Allows the browser’s built-in page search to find and expand the panel contents.
     *
     * Overrides the `keepMounted` prop and uses `hidden="until-found"`
     * to hide the element without removing it from the DOM.
     * @default false
     */
    hiddenUntilFound?: boolean;
    /**
     * Whether to keep the element in the DOM while the panel is closed.
     * This prop is ignored when `hiddenUntilFound` is used.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: boolean;
    /**
     * Event handler called when an accordion item is expanded or collapsed.
     * Provides the new value as an argument.
     */
    onValueChange?: (value: AccordionValue) => void;
    /**
     * Whether multiple items can be open at the same time.
     * @default true
     */
    openMultiple?: boolean;
    /**
     * The visual orientation of the accordion.
     * Controls whether roving focus uses left/right or up/down arrow keys.
     * @default 'vertical'
     */
    orientation?: Orientation;
  }
}
