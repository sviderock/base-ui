'use client';
import { batch, createSignal, type Accessor } from 'solid-js';
import { access, type MaybeAccessor } from '../solid-helpers';
import { useBaseUiId } from '../utils/useBaseUiId';

const EMPTY: string[] = [];

export function useCheckboxGroupParent(
  params: useCheckboxGroupParent.Parameters,
): useCheckboxGroupParent.ReturnValue {
  const allValues = () => access(params.allValues) ?? EMPTY;
  const value = () => access(params.value) ?? EMPTY;

  let uncontrolledStateRef = value();
  const disabledStatesRef = new Map<string, boolean>();

  const [status, setStatus] = createSignal<'on' | 'off' | 'mixed'>('mixed');

  const id = useBaseUiId();
  const checked = () => value().length === allValues().length;
  const indeterminate = () => value().length !== allValues().length && value().length > 0;

  const getParentProps: useCheckboxGroupParent.ReturnValue['getParentProps'] = () => ({
    id: id(),
    indeterminate: indeterminate(),
    checked: checked(),
    'aria-controls': allValues()
      .map((v) => `${id()}-${v}`)
      .join(' '),
    onCheckedChange(_, event) {
      batch(() => {
        const uncontrolledState = uncontrolledStateRef;

        // None except the disabled ones that are checked, which can't be changed.
        const none = allValues().filter(
          (v) => disabledStatesRef.get(v) && uncontrolledState.includes(v),
        );
        // "All" that are valid:
        // - any that aren't disabled
        // - disabled ones that are checked
        const all = allValues().filter(
          (v) =>
            !disabledStatesRef.get(v) ||
            (disabledStatesRef.get(v) && uncontrolledState.includes(v)),
        );

        const allOnOrOff =
          uncontrolledState.length === all.length || uncontrolledState.length === 0;

        if (allOnOrOff) {
          if (value().length === all.length) {
            params.onValueChange?.(none, event);
          } else {
            params.onValueChange?.(all, event);
          }
          return;
        }

        if (status() === 'mixed') {
          params.onValueChange?.(all, event);
          setStatus('on');
        } else if (status() === 'on') {
          params.onValueChange?.(none, event);
          setStatus('off');
        } else if (status() === 'off') {
          params.onValueChange?.(uncontrolledState, event);
          setStatus('mixed');
        }
      });
    },
  });

  const getChildProps: useCheckboxGroupParent.ReturnValue['getChildProps'] = (name: string) => ({
    name,
    id: `${id()}-${name}`,
    checked: value().includes(name),
    onCheckedChange(nextChecked, event) {
      batch(() => {
        const newValue = value().slice();
        if (nextChecked) {
          newValue.push(name);
        } else {
          newValue.splice(newValue.indexOf(name), 1);
        }
        uncontrolledStateRef = newValue;
        params.onValueChange?.(newValue, event);
        setStatus('mixed');
      });
    },
  });

  return {
    id,
    indeterminate,
    getParentProps,
    getChildProps,
    disabledStatesRef,
  };
}

export namespace useCheckboxGroupParent {
  export interface Parameters {
    allValues?: MaybeAccessor<string[] | undefined>;
    value?: MaybeAccessor<string[] | undefined>;
    onValueChange?: (value: string[], event: Event) => void;
  }

  export interface ReturnValue {
    id: Accessor<string | undefined>;
    indeterminate: Accessor<boolean>;
    disabledStatesRef: Map<string, boolean>;
    getParentProps: () => {
      id: string | undefined;
      indeterminate: boolean;
      checked: boolean;
      'aria-controls': string;
      onCheckedChange: (checked: boolean, event: Event) => void;
    };
    getChildProps: (name: string) => {
      name: string;
      id: string;
      checked: boolean;
      onCheckedChange: (checked: boolean, event: Event) => void;
    };
  }
}
