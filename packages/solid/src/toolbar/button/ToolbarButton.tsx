'use client';
import { batch, createMemo, onMount, type ComponentProps } from 'solid-js';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { BaseUIComponentProps } from '../../utils/types';
import { RenderElement } from '../../utils/useRenderElement';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';

/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export function ToolbarButton(componentProps: ToolbarButton.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'disabled',
    'focusableWhenDisabled',
    'nativeButton',
  ]);
  const disabledProp = () => access(local.disabled) ?? false;
  const focusableWhenDisabled = () => access(local.focusableWhenDisabled) ?? true;
  const nativeButton = () => access(local.nativeButton) ?? true;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const itemMetadata = createMemo(() => ({ focusableWhenDisabled: focusableWhenDisabled() }));

  const disabled = () => toolbarDisabled() || (groupContext?.disabled() ?? false) || disabledProp();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled,
    native: nativeButton,
  });

  const state = createMemo<ToolbarButton.State>(() => ({
    disabled: disabled(),
    orientation: orientation(),
    focusable: focusableWhenDisabled(),
  }));

  return (
    <CompositeItem<ToolbarRoot.ItemMetadata>
      metadata={itemMetadata}
      render={(p) => (
        <RenderElement
          element="button"
          componentProps={componentProps}
          ref={(el) => {
            batch(() => {
              if (p() && typeof p().ref === 'function') {
                (p().ref as Function)(el);
              } else {
                p().ref = el as unknown as HTMLDivElement;
              }
              buttonRef(el);
              if (typeof componentProps.ref === 'function') {
                componentProps.ref(el);
              } else {
                componentProps.ref = el;
              }
            });
          }}
          params={{
            state: state(),
            props: [
              p() as ComponentProps<'button'>,
              elementProps,
              // for integrating with Menu and Select disabled states, `disabled` is
              // intentionally duplicated even though getButtonProps includes it already
              // TODO: follow up after https://github.com/mui/base-ui/issues/1976#issuecomment-2916905663
              { disabled: disabled() },
              getButtonProps,
            ],
          }}
        />
      )}
    />
  );
}

export namespace ToolbarButton {
  export interface State extends ToolbarRoot.State {
    disabled: boolean;
    focusable: boolean;
  }

  export interface Props
    extends Omit<BaseUIComponentProps<'button', ToolbarRoot.State>, 'disabled'> {
    /**
     * When `true` the item is disabled.
     * @default false
     */
    disabled?: MaybeAccessor<boolean | undefined>;
    /**
     * When `true` the item remains focuseable when disabled.
     * @default true
     */
    focusableWhenDisabled?: MaybeAccessor<boolean | undefined>;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: MaybeAccessor<boolean | undefined>;
  }
}
