'use client';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { access, type MaybeAccessor, splitComponentProps } from '../../solid-helpers';
import { formatNumber } from '../../utils/formatNumber';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { ProgressRootContext } from './ProgressRootContext';
import { progressStyleHookMapping } from './styleHooks';

function formatValue(
  value: number | null,
  locale?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions,
): string {
  if (value == null) {
    return '';
  }

  if (!format) {
    return formatNumber(value / 100, locale, { style: 'percent' });
  }

  return formatNumber(value, locale, format);
}

function getDefaultAriaValueText(formattedValue: string | null, value: number | null) {
  if (value == null) {
    return 'indeterminate progress';
  }

  return formattedValue || `${value}%`;
}

/**
 * Groups all parts of the progress bar and provides the task completion status to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export function ProgressRoot(componentProps: ProgressRoot.Props) {
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

  const [labelId, setLabelId] = createSignal<string | undefined>();

  let formatOptionsRef = format();
  createEffect(() => {
    formatOptionsRef = format();
  });

  const status = createMemo<ProgressStatus>(() => {
    if (Number.isFinite(value())) {
      return value() === max() ? 'complete' : 'progressing';
    }

    return 'indeterminate';
  });

  const formattedValue = () => formatValue(value(), locale(), formatOptionsRef);

  const state = createMemo<ProgressRoot.State>(() => ({
    status: status(),
  }));

  const contextValue: ProgressRootContext = {
    formattedValue,
    max,
    min,
    setLabelId,
    state,
    status,
    value,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    customStyleHookMapping: progressStyleHookMapping,
    props: [
      () => ({
        'aria-labelledby': labelId(),
        'aria-valuemax': max(),
        'aria-valuemin': min(),
        'aria-valuenow': value() ?? undefined,
        'aria-valuetext': local.getAriaValueText
          ? local.getAriaValueText(formattedValue(), value())
          : (componentProps['aria-valuetext'] ??
            getDefaultAriaValueText(formattedValue(), value())),
        role: 'progressbar',
      }),
      elementProps,
    ],
  });

  return (
    <ProgressRootContext.Provider value={contextValue}>{element()}</ProgressRootContext.Provider>
  );
}

export type ProgressStatus = 'indeterminate' | 'progressing' | 'complete';

export namespace ProgressRoot {
  export type State = {
    status: ProgressStatus;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Options to format the value.
     */
    format?: MaybeAccessor<Intl.NumberFormatOptions | undefined>;
    /**
     * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the progress bar.
     * @param {string} formattedValue The component's formatted value.
     * @param {number | null} value The component's numerical value.
     * @returns {string}
     */
    getAriaValueText?: (formattedValue: string | null, value: number | null) => string;
    /**
     * The locale used by `Intl.NumberFormat` when formatting the value.
     * Defaults to the user's runtime locale.
     */
    locale?: MaybeAccessor<Intl.LocalesArgument | undefined>;
    /**
     * The maximum value.
     * @default 100
     */
    max?: MaybeAccessor<number | undefined>;
    /**
     * The minimum value.
     * @default 0
     */
    min?: MaybeAccessor<number | undefined>;
    /**
     * The current value. The component is indeterminate when value is `null`.
     * @default null
     */
    value: MaybeAccessor<number | null>;
  }
}
