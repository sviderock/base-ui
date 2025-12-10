'use client';
import { createMemo, createSignal } from 'solid-js';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
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
  const format = () => access(local.format);
  const locale = () => access(local.locale);
  const max = () => access(local.max) ?? 100;
  const min = () => access(local.min) ?? 0;
  const value = () => access(local.value);

  const [labelId, setLabelId] = createSignal<string>();

  const percentageValue = () => valueToPercent(value(), min(), max());
  const formattedValue = () => formatValue(value(), locale(), format());

  const ariaValuetext = createMemo(() => {
    if (local.getAriaValueText) {
      return local.getAriaValueText(formattedValue(), value());
    }

    if (format()) {
      return formattedValue();
    }

    return `${percentageValue()}%`;
  });

  const defaultProps = createMemo<HTMLProps>(() => ({
    'aria-labelledby': labelId(),
    'aria-valuemax': max(),
    'aria-valuemin': min(),
    'aria-valuenow': percentageValue() / 100,
    'aria-valuetext': ariaValuetext(),
    role: 'meter',
  }));

  const contextValue: MeterRootContext = {
    formattedValue,
    max,
    min,
    percentageValue,
    setLabelId,
    value,
  };

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
    format?: MaybeAccessor<Intl.NumberFormatOptions | undefined>;
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
    locale?: MaybeAccessor<Intl.LocalesArgument | undefined>;
    /**
     * The maximum value
     * @default 100
     */
    max?: MaybeAccessor<number | undefined>;
    /**
     * The minimum value
     * @default 0
     */
    min?: MaybeAccessor<number | undefined>;
    /**
     * The current value.
     */
    value: MaybeAccessor<number>;
  }
}
