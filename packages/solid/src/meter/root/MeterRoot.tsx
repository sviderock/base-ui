'use client';
import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { access, splitComponentProps, type CodependentRefs } from '../../solid-helpers';
import { formatNumber } from '../../utils/formatNumber';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { valueToPercent } from '../../utils/valueToPercent';
import { MeterRootContext } from './MeterRootContext';

function formatValue(
  value: number,
  locale?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions,
): string {
  if (!format) {
    return formatNumber(value / 100, locale, { style: 'percent' });
  }

  return formatNumber(value, locale, format);
}

/**
 * Groups all parts of the meter and provides the value for screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export function MeterRoot(componentProps: MeterRoot.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'format',
    'getAriaValueText',
    'locale',
    'max',
    'min',
    'value',
  ]);
  const max = () => access(local.max) ?? 100;
  const min = () => access(local.min) ?? 0;

  const [labelId, setLabelId] = createSignal<string>();
  const [codependentRefs, setCodependentRefs] = createStore<CodependentRefs<['label']>>({});

  const percentageValue = () => valueToPercent(local.value, min(), max());
  const formattedValue = () => formatValue(local.value, local.locale, local.format);

  const ariaValuetext = createMemo(() => {
    if (local.getAriaValueText) {
      return local.getAriaValueText(formattedValue(), local.value);
    }

    if (local.format) {
      return formattedValue();
    }

    return `${percentageValue()}%`;
  });

  const defaultProps: HTMLProps = {
    role: 'meter',
    get 'aria-labelledby'() {
      return labelId();
    },
    get 'aria-valuemax'() {
      return max();
    },
    get 'aria-valuemin'() {
      return min();
    },
    get 'aria-valuenow'() {
      return percentageValue() / 100;
    },
    get 'aria-valuetext'() {
      return ariaValuetext();
    },
  };

  const contextValue: MeterRootContext = {
    formattedValue,
    max,
    min,
    percentageValue,
    value: () => local.value,
    codependentRefs,
    setCodependentRefs,
  };

  createEffect(
    on(
      () => codependentRefs.label,
      (label) => {
        if (label) {
          setLabelId(label.id() ?? label.explicitId());
        }

        onCleanup(() => {
          setLabelId(undefined);
        });
      },
    ),
  );

  const element = useRenderElement('div', componentProps, {
    props: [defaultProps, elementProps],
  });

  return <MeterRootContext.Provider value={contextValue}>{element()}</MeterRootContext.Provider>;
}

export namespace MeterRoot {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Options to format the value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * A function that returns a string value that provides a human-readable text alternative for the current value of the meter.
     * @param {string} formattedValue The formatted value
     * @param {number} value The raw value
     * @returns {string}
     */
    getAriaValueText?: (formattedValue: string, value: number) => string;
    /**
     * The locale used by `Intl.NumberFormat` when formatting the value.
     * Defaults to the user's runtime locale.
     */
    locale?: Intl.LocalesArgument;
    /**
     * The maximum value
     * @default 100
     */
    max?: number;
    /**
     * The minimum value
     * @default 0
     */
    min?: number;
    /**
     * The current value.
     */
    value: number;
  }
}
