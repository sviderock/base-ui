'use client';
import { batch, createEffect, type JSX } from 'solid-js';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useField } from '../../field/useField';
import { fieldValidityMapping } from '../../field/utils/constants';
import { stopEvent } from '../../floating-ui-solid/utils';
import { useFormContext } from '../../form/FormContext';
import { combineProps } from '../../merge-props';
import { splitComponentProps } from '../../solid-helpers';
import { formatNumber, formatNumberMaxPrecision } from '../../utils/formatNumber';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { DEFAULT_STEP } from '../utils/constants';
import { ARABIC_RE, HAN_RE, getNumberLocaleDetails, parseNumber } from '../utils/parse';
import { styleHookMapping } from '../utils/styleHooks';

const customStyleHookMapping = {
  ...fieldValidityMapping,
  ...styleHookMapping,
};

const NAVIGATE_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'Tab',
  'Enter',
  'Escape',
]);

/**
 * The native input control in the number field.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export function NumberFieldInput(componentProps: NumberFieldInput.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const {
    refs,
    disabled,
    getAllowedNonNumericKeys,
    getStepAmount,
    id,
    incrementValue,
    inputMode,
    inputValue,
    max,
    min,
    name,
    readOnly,
    required,
    setValue,
    state,
    setInputValue,
    locale,
    value,
  } = useNumberFieldRootContext();

  const { clearErrors } = useFormContext();
  const { labelId, validationMode, setTouched, setFocused, invalid } = useFieldRootContext();

  const {
    getInputValidationProps,
    getValidationProps,
    commitValidation,
    refs: fieldControlRefs,
  } = useFieldControlValidation();

  let hasTouchedInputRef = false;
  let blockRevalidationRef = false;

  useField({
    id,
    commitValidation,
    value,
    controlRef: () => refs.inputRef,
    name,
    getValue: () => value() ?? null,
  });

  let prevValueRef = value();
  let prevInputValueRef = inputValue();

  // TODO: this effect has to be the first in order to sync the refs
  createEffect(() => {
    prevValueRef = value();
    prevInputValueRef = inputValue();
  });

  createEffect(() => {
    if (prevValueRef === value() && prevInputValueRef === inputValue()) {
      return;
    }

    clearErrors(name());

    if (validationMode() === 'onChange') {
      commitValidation(value());
    }
  });

  createEffect(() => {
    if (prevValueRef === value() || validationMode() === 'onChange') {
      return;
    }

    if (blockRevalidationRef) {
      blockRevalidationRef = false;
      return;
    }
    commitValidation(value(), true);
  });

  const inputProps: JSX.InputHTMLAttributes<HTMLInputElement> = {
    type: 'text',
    autocomplete: 'nope',
    autocorrect: 'off',
    spellcheck: 'false',
    'aria-roledescription': 'Number field',
    get id() {
      return id();
    },
    get required() {
      return required();
    },
    get disabled() {
      return disabled();
    },
    get readOnly() {
      return readOnly();
    },
    get inputMode() {
      return inputMode();
    },
    get value() {
      return inputValue();
    },
    get 'aria-invalid'() {
      return invalid() || undefined;
    },
    get 'aria-labelledby'() {
      return labelId();
    },
    // TODO: do we need this for Solid?
    // If the server's locale does not match the client's locale, the formatting may not match,
    // causing a hydration mismatch.
    // suppressHydrationWarning: true,
    onFocus(event) {
      if (event.defaultPrevented || readOnly() || disabled() || hasTouchedInputRef) {
        return;
      }

      hasTouchedInputRef = true;
      setFocused(true);

      // Browsers set selection at the start of the input field by default. We want to set it at
      // the end for the first focus.
      const target = event.currentTarget;
      const length = target.value.length;
      target.setSelectionRange(length, length);
    },
    onBlur(event) {
      if (event.defaultPrevented || readOnly() || disabled()) {
        return;
      }

      setTouched(true);
      setFocused(false);

      refs.allowInputSyncRef = true;

      if (inputValue().trim() === '') {
        setValue(null);
        if (validationMode() === 'onBlur') {
          commitValidation(null);
        }
        return;
      }

      const formatOptions = refs.formatOptionsRef;
      const parsedValue = parseNumber(inputValue(), locale(), formatOptions);
      const canonicalText = formatNumber(parsedValue, locale(), formatOptions);
      const maxPrecisionText = formatNumberMaxPrecision(parsedValue, locale(), formatOptions);
      const canonical = parseNumber(canonicalText, locale(), formatOptions);
      const maxPrecision = parseNumber(maxPrecisionText, locale(), formatOptions);

      if (parsedValue === null) {
        return;
      }

      blockRevalidationRef = true;

      if (validationMode() === 'onBlur') {
        commitValidation(canonical);
      }

      const hasExplicitPrecision =
        formatOptions?.maximumFractionDigits != null ||
        formatOptions?.minimumFractionDigits != null;

      if (hasExplicitPrecision) {
        // When the consumer explicitly requests a precision, always round the number to that
        // precision and normalize the displayed text accordingly.
        if (value() !== canonical) {
          setValue(canonical, event);
        }
        if (inputValue() !== canonicalText) {
          setInputValue(canonicalText);
        }
      } else if (value() !== maxPrecision) {
        // Default behaviour: preserve max precision until it differs from canonical
        setValue(canonical, event);
      } else {
        const shouldPreserveFullPrecision =
          parsedValue === value() && inputValue() === maxPrecisionText;
        if (!shouldPreserveFullPrecision && inputValue() !== canonicalText) {
          setInputValue(canonicalText);
        }
      }
    },
    onInput(event) {
      // Workaround for https://github.com/facebook/react/issues/9023
      if (event.defaultPrevented) {
        return;
      }

      refs.allowInputSyncRef = false;
      const targetValue = event.target.value;

      if (targetValue.trim() === '') {
        batch(() => {
          setInputValue(targetValue);
          setValue(null, event);
        });
        return;
      }

      if (event.isTrusted) {
        setInputValue(targetValue);
        return;
      }

      const parsedValue = parseNumber(targetValue, locale(), refs.formatOptionsRef);
      if (parsedValue !== null) {
        batch(() => {
          setInputValue(targetValue);
          setValue(parsedValue, event);
        });
      }
    },
    onKeyDown(event) {
      if (event.defaultPrevented || readOnly() || disabled()) {
        return;
      }

      refs.allowInputSyncRef = true;

      const allowedNonNumericKeys = getAllowedNonNumericKeys();

      let isAllowedNonNumericKey = allowedNonNumericKeys.has(event.key);

      const { decimal, currency, percentSign } = getNumberLocaleDetails([], refs.formatOptionsRef);

      const selectionStart = event.currentTarget.selectionStart;
      const selectionEnd = event.currentTarget.selectionEnd;
      const isAllSelected = selectionStart === 0 && selectionEnd === inputValue().length;

      // Allow the minus key only if there isn't already a plus or minus sign, or if all the text
      // is selected, or if only the minus sign is highlighted.
      if (event.key === '-' && allowedNonNumericKeys.has('-')) {
        const isMinusHighlighted =
          selectionStart === 0 && selectionEnd === 1 && inputValue()[0] === '-';
        isAllowedNonNumericKey = !inputValue().includes('-') || isAllSelected || isMinusHighlighted;
      }

      // Only allow one of each symbol.
      [decimal, currency, percentSign].forEach((symbol) => {
        if (event.key === symbol) {
          const symbolIndex = inputValue().indexOf(symbol);
          const isSymbolHighlighted =
            selectionStart === symbolIndex && selectionEnd === symbolIndex + 1;
          isAllowedNonNumericKey =
            !inputValue().includes(symbol) || isAllSelected || isSymbolHighlighted;
        }
      });

      const isLatinNumeral = /^[0-9]$/.test(event.key);
      const isArabicNumeral = ARABIC_RE.test(event.key);
      const isHanNumeral = HAN_RE.test(event.key);
      const isNavigateKey = NAVIGATE_KEYS.has(event.key);

      if (
        // Allow composition events (e.g., pinyin)
        // event.nativeEvent.isComposing does not work in Safari:
        // https://bugs.webkit.org/show_bug.cgi?id=165004
        event.which === 229 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isAllowedNonNumericKey ||
        isLatinNumeral ||
        isArabicNumeral ||
        isHanNumeral ||
        isNavigateKey
      ) {
        return;
      }

      // We need to commit the number at this point if the input hasn't been blurred.
      const parsedValue = parseNumber(inputValue(), locale(), refs.formatOptionsRef);

      const amount = getStepAmount(event) ?? DEFAULT_STEP;

      // Prevent insertion of text or caret from moving.
      stopEvent(event);

      if (event.key === 'ArrowUp') {
        incrementValue(amount, 1, parsedValue, event);
      } else if (event.key === 'ArrowDown') {
        incrementValue(amount, -1, parsedValue, event);
      } else if (event.key === 'Home' && min() != null) {
        setValue(min()!, event);
      } else if (event.key === 'End' && max() != null) {
        setValue(max()!, event);
      }
    },
    onPaste(event) {
      if (event.defaultPrevented || readOnly() || disabled()) {
        return;
      }

      // Prevent `onChange` from being called.
      event.preventDefault();

      const clipboardData = (event.clipboardData || window.Clipboard) as DataTransfer;
      const pastedData = clipboardData.getData('text/plain');
      const parsedValue = parseNumber(pastedData, locale(), refs.formatOptionsRef);

      if (parsedValue !== null) {
        batch(() => {
          refs.allowInputSyncRef = false;
          setValue(parsedValue, event);
          setInputValue(pastedData);
        });
      }
    },
  };

  const element = useRenderElement('input', componentProps, {
    state,
    ref: (el) => {
      refs.inputRef = el;
      fieldControlRefs.inputRef = el;
    },
    props: [
      inputProps,
      (props) => combineProps(props, getInputValidationProps()),
      (props) => combineProps(props, getValidationProps()),
      elementProps,
    ],
    customStyleHookMapping,
  });

  return <>{element()}</>;
}

export namespace NumberFieldInput {
  export interface State extends NumberFieldRoot.State {}

  export interface Props extends BaseUIComponentProps<'input', State> {}
}
