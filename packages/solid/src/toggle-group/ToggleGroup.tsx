'use client';
import { batch, createMemo, Show } from 'solid-js';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { access, splitComponentProps, type MaybeAccessor } from '../solid-helpers';
import { useToolbarRootContext } from '../toolbar/root/ToolbarRootContext';
import type { BaseUIComponentProps, Orientation } from '../utils/types';
import { useControlled } from '../utils/useControlled';
import { useRenderElement } from '../utils/useRenderElementV2';
import { ToggleGroupContext } from './ToggleGroupContext';
import { ToggleGroupDataAttributes } from './ToggleGroupDataAttributes';

const customStyleHookMapping = {
  multiple(value: MaybeAccessor<boolean>) {
    if (access(value)) {
      return { [ToggleGroupDataAttributes.multiple]: '' } as Record<string, string>;
    }
    return null;
  },
};

/**
 * Provides a shared state to a series of toggle buttons.
 *
 * Documentation: [Base UI Toggle Group](https://base-ui.com/react/components/toggle-group)
 */
export function ToggleGroup(componentProps: ToggleGroup.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'defaultValue',
    'disabled',
    'loop',
    'onValueChange',
    'orientation',
    'toggleMultiple',
    'value',
  ]);
  const defaultValueProp = () => access(local.defaultValue);
  const disabledProp = () => access(local.disabled) ?? false;
  const loop = () => access(local.loop) ?? true;
  const orientation = () => access(local.orientation) ?? 'horizontal';
  const toggleMultiple = () => access(local.toggleMultiple) ?? false;
  const valueProp = () => access(local.value);

  const toolbarContext = useToolbarRootContext(true);

  const defaultValue = createMemo(() => {
    if (valueProp() === undefined) {
      return defaultValueProp() ?? [];
    }

    return undefined;
  });

  const disabled = () => (toolbarContext?.disabled() ?? false) || disabledProp();

  const [groupValue, setValueState] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'ToggleGroup',
    state: 'value',
  });

  const setGroupValue = (newValue: string, nextPressed: boolean, event: Event) => {
    let newGroupValue: any[] | undefined;
    if (toggleMultiple()) {
      newGroupValue = groupValue()?.slice();
      if (nextPressed) {
        newGroupValue.push(newValue);
      } else {
        newGroupValue.splice(groupValue().indexOf(newValue), 1);
      }
    } else {
      newGroupValue = nextPressed ? [newValue] : [];
    }
    if (Array.isArray(newGroupValue)) {
      batch(() => {
        setValueState(newGroupValue);
        local.onValueChange?.(newGroupValue, event);
      });
    }
  };

  const state = createMemo<ToggleGroup.State>(() => ({
    disabled: disabled(),
    multiple: toggleMultiple(),
    orientation: orientation(),
  }));

  const contextValue: ToggleGroupContext = {
    disabled,
    orientation,
    setGroupValue,
    value: groupValue,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    props: [{ role: 'group' }, elementProps],
    customStyleHookMapping,
  });

  const memoizedElement = createMemo(() => element());

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <Show
        when={toolbarContext}
        fallback={<CompositeRoot loop={loop()} stopEventPropagation render={element} />}
      >
        {memoizedElement()}
      </Show>
    </ToggleGroupContext.Provider>
  );
}

export namespace ToggleGroup {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    multiple: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The open state of the toggle group represented by an array of
     * the values of all pressed toggle buttons.
     * This is the controlled counterpart of `defaultValue`.
     */
    value?: MaybeAccessor<readonly any[] | undefined>;
    /**
     * The open state of the toggle group represented by an array of
     * the values of all pressed toggle buttons.
     * This is the uncontrolled counterpart of `value`.
     */
    defaultValue?: MaybeAccessor<readonly any[] | undefined>;
    /**
     * Callback fired when the pressed states of the toggle group changes.
     *
     * @param {any[]} groupValue An array of the `value`s of all the pressed items.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onValueChange?: (groupValue: any[], event: Event) => void;
    /**
     * Whether the toggle group should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * @default 'horizontal'
     */
    orientation?: MaybeAccessor<Orientation | undefined>;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: MaybeAccessor<boolean | undefined>;
    /**
     * When `false` only one item in the group can be pressed. If any item in
     * the group becomes pressed, the others will become unpressed.
     * When `true` multiple items can be pressed.
     * @default false
     */
    toggleMultiple?: MaybeAccessor<boolean | undefined>;
  }
}
