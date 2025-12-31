import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { splitComponentProps, type CodependentRefs } from '../../solid-helpers';
import { formatNumber } from '../../utils/formatNumber';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
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
  const max = () => local.max ?? 100;
  const min = () => local.min ?? 0;

  const [labelId, setLabelId] = createSignal<string | undefined>();
  const [codependentRefs, setCodependentRefs] = createStore<CodependentRefs<['label']>>({});

  let formatOptionsRef = local.format;
  createEffect(() => {
    formatOptionsRef = local.format;
  });

  const status = createMemo<ProgressStatus>(() => {
    if (Number.isFinite(local.value)) {
      return local.value === max() ? 'complete' : 'progressing';
    }

    return 'indeterminate';
  });

  const formattedValue = () => formatValue(local.value, local.locale, formatOptionsRef);

  const state: ProgressRoot.State = {
    get status() {
      return status();
    },
  };

  const contextValue: ProgressRootContext = {
    formattedValue,
    max,
    min,
    state,
    status,
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
    state,
    customStyleHookMapping: progressStyleHookMapping,
    props: [
      {
        role: 'progressbar',
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
          return local.value ?? undefined;
        },
        get 'aria-valuetext'() {
          return local.getAriaValueText
            ? local.getAriaValueText(formattedValue(), local.value)
            : (componentProps['aria-valuetext'] ??
                getDefaultAriaValueText(formattedValue(), local.value));
        },
      },
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
    format?: Intl.NumberFormatOptions;
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
    locale?: Intl.LocalesArgument;
    /**
     * The maximum value.
     * @default 100
     */
    max?: number;
    /**
     * The minimum value.
     * @default 0
     */
    min?: number;
    /**
     * The current value. The component is indeterminate when value is `null`.
     * @default null
     */
    value: number | null;
  }
}
