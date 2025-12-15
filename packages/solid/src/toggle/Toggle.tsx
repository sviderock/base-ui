'use client';
import { batch, createMemo, onMount, Show } from 'solid-js';
import { CompositeItem } from '../composite/item/CompositeItem';
import { access, splitComponentProps, type MaybeAccessor } from '../solid-helpers';
import { useToggleGroupContext } from '../toggle-group/ToggleGroupContext';
import { useButton } from '../use-button/useButton';
import type { BaseUIComponentProps } from '../utils/types';
import { useControlled } from '../utils/useControlled';
import { useRenderElement } from '../utils/useRenderElement';

/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export function Toggle(componentProps: Toggle.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'defaultPressed',
    'disabled',
    'form',
    'onPressedChange',
    'pressed',
    'type',
    'value',
    'nativeButton',
  ]);
  const defaultPressedProp = () => access(local.defaultPressed) ?? false;
  const disabledProp = () => access(local.disabled) ?? false;
  const pressedProp = () => access(local.pressed);
  const value = () => access(local.value) ?? '';
  const nativeButton = () => access(local.nativeButton) ?? true;

  const groupContext = useToggleGroupContext();

  const groupValue = () => groupContext?.value() ?? [];

  const defaultPressed = () => (groupContext ? undefined : defaultPressedProp());

  const disabled = () => (disabledProp() || groupContext?.disabled()) ?? false;

  const [pressed, setPressedState] = useControlled({
    controlled: () =>
      groupContext && value() ? groupValue()?.indexOf(value()) > -1 : pressedProp(),
    default: defaultPressed,
    name: 'Toggle',
    state: 'pressed',
  });

  const onPressedChange = (nextPressed: boolean, event: Event) => {
    batch(() => {
      groupContext?.setGroupValue?.(value(), nextPressed, event);
      local.onPressedChange?.(nextPressed, event);
    });
  };

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const state = createMemo<Toggle.State>(() => ({
    disabled: disabled(),
    pressed: pressed(),
  }));

  const element = useRenderElement('button', componentProps, {
    state,
    ref: buttonRef,
    props: [
      () => ({
        'aria-pressed': pressed(),
        onClick(event) {
          const nextPressed = !pressed();
          batch(() => {
            setPressedState(nextPressed);
            onPressedChange(nextPressed, event);
          });
        },
      }),
      elementProps,
      getButtonProps,
    ],
  });

  return (
    <Show when={groupContext} fallback={element()}>
      <CompositeItem render={element} />
    </Show>
  );
}

export namespace Toggle {
  export interface State {
    /**
     * Whether the toggle is currently pressed.
     */
    pressed: boolean;
    /**
     * Whether the toggle should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends Omit<BaseUIComponentProps<'button', State>, 'disabled' | 'value'> {
    /**
     * Whether the toggle button is currently pressed.
     * This is the controlled counterpart of `defaultPressed`.
     */
    pressed?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the toggle button is currently pressed.
     * This is the uncontrolled counterpart of `pressed`.
     * @default false
     */
    defaultPressed?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Callback fired when the pressed state is changed.
     *
     * @param {boolean} pressed The new pressed state.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onPressedChange?: (pressed: boolean, event: Event) => void;
    /**
     * A unique string that identifies the toggle when used
     * inside a toggle group.
     */
    value?: MaybeAccessor<string | undefined>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }
}
