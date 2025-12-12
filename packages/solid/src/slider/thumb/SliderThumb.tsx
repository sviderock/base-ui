'use client';
import {
  batch,
  createMemo,
  createRenderEffect,
  onCleanup,
  type Accessor,
  type ComponentProps,
  type JSX,
} from 'solid-js';
import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  COMPOSITE_KEYS,
  END,
  HOME,
} from '../../composite/composite';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { mergeProps } from '../../merge-props';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { formatNumber } from '../../utils/formatNumber';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { resolveClassName } from '../../utils/resolveClassName';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElementV2';
import { visuallyHidden } from '../../utils/visuallyHidden';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { getSliderValue } from '../utils/getSliderValue';
import { roundValueToStep } from '../utils/roundValueToStep';
import { valueArrayToPercentages } from '../utils/valueArrayToPercentages';
import { SliderThumbDataAttributes } from './SliderThumbDataAttributes';

const PAGE_UP = 'PageUp';
const PAGE_DOWN = 'PageDown';

const ALL_KEYS = new Set([
  ARROW_UP,
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  HOME,
  END,
  PAGE_UP,
  PAGE_DOWN,
]);

function getDefaultAriaValueText(
  values: readonly number[],
  index: number,
  format: Intl.NumberFormatOptions | undefined,
  locale: Intl.LocalesArgument | undefined,
): string | undefined {
  if (index < 0) {
    return undefined;
  }

  if (values.length === 2) {
    if (index === 0) {
      return `${formatNumber(values[index], locale, format)} start range`;
    }

    return `${formatNumber(values[index], locale, format)} end range`;
  }

  return format ? formatNumber(values[index], locale, format) : undefined;
}

function getNewValue(
  thumbValue: number,
  step: number,
  direction: 1 | -1,
  min: number,
  max: number,
): number {
  return direction === 1 ? Math.min(thumbValue + step, max) : Math.max(thumbValue - step, min);
}

/**
 * The draggable part of the the slider at the tip of the indicator.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export function SliderThumb(componentProps: SliderThumb.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'getAriaLabel',
    'getAriaValueText',
    'id',
    'onBlur',
    'onFocus',
    'onKeyDown',
    'tabIndex',
  ]);
  const disabledProp = () => access(local.disabled) ?? false;
  const idProp = () => access(local.id);
  const tabIndexProp = () => access(local.tabIndex);

  const id = useBaseUiId(idProp);
  const inputId = () => `${id()}-input`;

  const {
    active: activeIndex,
    disabled: contextDisabled,
    fieldControlValidation,
    refs,
    handleInputChange,
    labelId,
    largeStep,
    locale,
    max,
    min,
    minStepsBetweenValues,
    orientation,
    setActive,
    state,
    step,
    tabIndex: contextTabIndex,
    values: sliderValues,
  } = useSliderRootContext();

  const disabled = () => disabledProp() || contextDisabled();

  const externalTabIndex = () => tabIndexProp() ?? contextTabIndex();

  const direction = useDirection();
  const { setControlId, setTouched, setFocused, validationMode } = useFieldRootContext();

  let thumbRef = null as HTMLElement | null | undefined;

  createRenderEffect(() => {
    setControlId(inputId());
  });

  onCleanup(() => {
    setControlId(undefined);
  });

  const thumbMetadata = { inputId };

  const { setRef: setListItemRef, index } = useCompositeListItem<ThumbMetadata>({
    metadata: thumbMetadata,
  });

  const thumbValue = () => sliderValues()[index()];

  const percentageValues = createMemo(() =>
    valueArrayToPercentages(sliderValues().slice(), min(), max()),
  );
  // for SSR, don't wait for the index if there's only one thumb
  const percent = () =>
    percentageValues().length === 1 ? percentageValues()[0] : percentageValues()[index()];

  const isRtl = () => direction() === 'rtl';

  const getThumbStyle = () => {
    const isVertical = orientation() === 'vertical';

    if (!Number.isFinite(percent())) {
      return visuallyHidden;
    }

    return {
      position: 'absolute',
      [{
        horizontal: 'inset-inline-start',
        vertical: 'bottom',
      }[orientation()]]: `${percent()}%`,
      [isVertical ? 'left' : 'top']: '50%',
      transform: `translate(${(isVertical || !isRtl() ? -1 : 1) * 50}%, ${(isVertical ? 1 : -1) * 50}%)`,
      'z-index': activeIndex() === index() ? 1 : undefined,
    } satisfies JSX.CSSProperties;
  };

  const styleHooks = createMemo(() =>
    getStyleHookProps({
      disabled: disabled(),
      dragging: index() !== -1 && activeIndex() === index(),
    }),
  );

  const thumbProps = createMemo(() => {
    return mergeProps(
      {
        [SliderThumbDataAttributes.index]: index(),
        class: resolveClassName(componentProps.class, state),
        id: id(),
        onFocus() {
          batch(() => {
            setActive(index());
            setFocused(true);
          });
        },
        onBlur() {
          if (!thumbRef) {
            return;
          }
          batch(() => {
            setActive(-1);
            setTouched(true);
            setFocused(false);

            if (validationMode() === 'onBlur') {
              fieldControlValidation.commitValidation(
                getSliderValue(
                  thumbValue(),
                  index(),
                  min(),
                  max(),
                  sliderValues().length > 1,
                  sliderValues(),
                ),
              );
            }
          });
        },
        onKeyDown(event: KeyboardEvent) {
          if (!ALL_KEYS.has(event.key)) {
            return;
          }
          if (COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }

          let newValue = null;
          const isRange = sliderValues().length > 1;
          const roundedValue = roundValueToStep(thumbValue(), step(), min());
          switch (event.key) {
            case ARROW_UP:
              newValue = getNewValue(
                roundedValue,
                event.shiftKey ? largeStep() : step(),
                1,
                min(),
                max(),
              );
              break;
            case ARROW_RIGHT:
              newValue = getNewValue(
                roundedValue,
                event.shiftKey ? largeStep() : step(),
                isRtl() ? -1 : 1,
                min(),
                max(),
              );
              break;
            case ARROW_DOWN:
              newValue = getNewValue(
                roundedValue,
                event.shiftKey ? largeStep() : step(),
                -1,
                min(),
                max(),
              );
              break;
            case ARROW_LEFT:
              newValue = getNewValue(
                roundedValue,
                event.shiftKey ? largeStep() : step(),
                isRtl() ? 1 : -1,
                min(),
                max(),
              );
              break;
            case PAGE_UP:
              newValue = getNewValue(roundedValue, largeStep(), 1, min(), max());
              break;
            case PAGE_DOWN:
              newValue = getNewValue(roundedValue, largeStep(), -1, min(), max());
              break;
            case END:
              newValue = max();

              if (isRange) {
                newValue = Number.isFinite(sliderValues()[index() + 1])
                  ? sliderValues()[index() + 1] - step() * minStepsBetweenValues()
                  : max();
              }
              break;
            case HOME:
              newValue = min();

              if (isRange) {
                newValue = Number.isFinite(sliderValues()[index() - 1])
                  ? sliderValues()[index() - 1] + step() * minStepsBetweenValues()
                  : min();
              }
              break;
            default:
              break;
          }

          if (newValue !== null) {
            handleInputChange(newValue, index(), event);
            event.preventDefault();
          }
        },
        ref: (el: HTMLElement) => {
          setListItemRef(el);
          thumbRef = el;
        },
        style: getThumbStyle(),
        tabIndex: externalTabIndex() ?? (disabled() ? undefined : 0),
      },
      styleHooks(),
      elementProps,
    );
  });

  const cssWritingMode = createMemo<JSX.CSSProperties['writing-mode']>(() => {
    if (orientation() === 'vertical') {
      return isRtl() ? 'vertical-rl' : 'vertical-lr';
    }
    return undefined;
  });

  const inputProps = createMemo(() => {
    return mergeProps<'input'>(
      {
        'aria-label':
          typeof local.getAriaLabel === 'function'
            ? local.getAriaLabel(index())
            : elementProps['aria-label'],
        'aria-labelledby': labelId(),
        'aria-orientation': orientation(),
        'aria-valuemax': max(),
        'aria-valuemin': min(),
        'aria-valuenow': thumbValue(),
        'aria-valuetext':
          typeof local.getAriaValueText === 'function'
            ? local.getAriaValueText(
                formatNumber(thumbValue(), locale(), refs.formatOptionsRef ?? undefined),
                thumbValue(),
                index(),
              )
            : elementProps['aria-valuetext'] ||
              getDefaultAriaValueText(
                sliderValues(),
                index(),
                refs.formatOptionsRef ?? undefined,
                locale(),
              ),
        [SliderThumbDataAttributes.index as string]: index(),
        disabled: disabled(),
        id: inputId(),
        max: max(),
        min: min(),
        onInput(event: InputEvent) {
          handleInputChange((event.target as HTMLInputElement).valueAsNumber, index(), event);
        },
        // Need to bubble the focus event to the thumb
        onFocus() {
          thumbRef?.dispatchEvent(new FocusEvent('focus'));
        },
        // Need to bubble the blur event to the thumb
        onBlur() {
          thumbRef?.dispatchEvent(new FocusEvent('blur'));
        },
        step: step(),
        style: {
          ...visuallyHidden,
          // So that VoiceOver's focus indicator matches the thumb's dimensions
          width: '100%',
          height: '100%',
          'writing-mode': cssWritingMode(),
        },
        tabIndex: -1,
        type: 'range',
        value: thumbValue() ?? '',
      },
      fieldControlValidation.getValidationProps,
    );
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      setListItemRef(el);
      thumbRef = el;
    },
    props: thumbProps,
    children: () =>
      componentProps.render == null ? (
        <>
          {thumbProps().children ?? componentProps.children}
          <input
            {...inputProps()}
            ref={(el) => {
              inputProps().ref = el;
            }}
          />
        </>
      ) : undefined,
  });
  return <>{element()}</>;
}

export interface ThumbMetadata {
  inputId: Accessor<string | undefined>;
}

export namespace SliderThumb {
  export interface State extends SliderRoot.State {}

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'render'> {
    /**
     * Whether the thumb should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the input associated with the thumb
     * @param {number} index The index of the input
     * @returns {string}
     * @type {((index: number) => string) | null}
     */
    getAriaLabel?: ((index: number) => string) | null;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.
     * This is important for screen reader users.
     * @param {string} formattedValue The thumb's formatted value.
     * @param {number} value The thumb's numerical value.
     * @param {number} index The thumb's index.
     * @returns {string}
     * @type {((formattedValue: string, value: number, index: number) => string) | null}
     */
    getAriaValueText?: ((formattedValue: string, value: number, index: number) => string) | null;
    /**
     * Allows you to replace the component’s HTML element
     * with a different tag, or compose it with another component.
     *
     * Accepts a `ReactElement` or a function that returns the element to render.
     */
    render?: Exclude<BaseUIComponentProps<'div', State>['render'], Function> &
      ((
        props: ComponentProps<'div'>,
        inputProps: ComponentProps<'input'>,
        state: State,
      ) => JSX.Element);
  }
}
