import { batch, Show } from 'solid-js';
import { CompositeItem } from '../composite/item/CompositeItem';
import { splitComponentProps } from '../solid-helpers';
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
  const defaultPressedProp = () => local.defaultPressed ?? false;
  const disabledProp = () => local.disabled ?? false;
  const value = () => local.value ?? '';
  const nativeButton = () => local.nativeButton ?? true;

  const groupContext = useToggleGroupContext();

  const groupValue = () => groupContext?.value() ?? [];

  const defaultPressed = () => (groupContext ? undefined : defaultPressedProp());

  const disabled = () => (disabledProp() || groupContext?.disabled()) ?? false;

  const [pressed, setPressedState] = useControlled({
    controlled: () =>
      groupContext && value() ? groupValue()?.indexOf(value()) > -1 : local.pressed,
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

  const state: Toggle.State = {
    get disabled() {
      return disabled();
    },
    get pressed() {
      return pressed();
    },
  };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: buttonRef,
    props: [
      {
        get 'aria-pressed'() {
          return pressed();
        },
        onClick(event) {
          const nextPressed = !pressed();
          batch(() => {
            setPressedState(nextPressed);
            onPressedChange(nextPressed, event);
          });
        },
      },
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

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the toggle button is currently pressed.
     * This is the controlled counterpart of `defaultPressed`.
     */
    pressed?: boolean;
    /**
     * Whether the toggle button is currently pressed.
     * This is the uncontrolled counterpart of `pressed`.
     * @default false
     */
    defaultPressed?: boolean;
    /**
     * Callback fired when the pressed state is changed.
     *
     * @param {boolean} pressed The new pressed state.
     * @param {Event} event The corresponding event that initiated the change.
     */
    onPressedChange?: (pressed: boolean, event: Event) => void;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
  }
}
