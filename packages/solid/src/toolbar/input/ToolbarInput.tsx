'use client';
import { createMemo, type ComponentProps } from 'solid-js';
import { ARROW_LEFT, ARROW_RIGHT, stopEvent } from '../../composite/composite';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { access, splitComponentProps, type MaybeAccessor } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useFocusableWhenDisabled } from '../../utils/useFocusableWhenDisabled';
import { RenderElement } from '../../utils/useRenderElement';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';
import type { ToolbarRoot } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';

/**
 * A native input element that integrates with Toolbar keyboard navigation.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export function ToolbarInput(componentProps: ToolbarInput.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, [
    'focusableWhenDisabled',
    'disabled',
  ]);
  const focusableWhenDisabled = () => access(local.focusableWhenDisabled) ?? true;
  const disabledProp = () => access(local.disabled) ?? false;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const itemMetadata = createMemo(() => ({ focusableWhenDisabled: focusableWhenDisabled() }));

  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;

  const { props: focusableWhenDisabledProps } = useFocusableWhenDisabled({
    composite: true,
    disabled,
    focusableWhenDisabled,
    isNativeButton: false,
  });

  const state = createMemo<ToolbarInput.State>(() => ({
    disabled: disabled(),
    orientation: orientation(),
    focusable: focusableWhenDisabled(),
  }));

  return (
    <CompositeItem<ToolbarRoot.ItemMetadata>
      metadata={itemMetadata()}
      render={(p) => (
        <RenderElement
          element="input"
          componentProps={componentProps}
          ref={(el) => {
            p().ref(el);
            if (typeof componentProps.ref === 'function') {
              componentProps.ref(el);
            } else {
              componentProps.ref = el;
            }
          }}
          params={{
            state: state(),
            props: [
              p(),
              {
                onClick(event) {
                  if (disabled()) {
                    event.preventDefault();
                  }
                },
                onKeyDown(event) {
                  if (event.key !== ARROW_LEFT && event.key !== ARROW_RIGHT && disabled()) {
                    stopEvent(event);
                  }
                },
                onPointerDown(event) {
                  if (disabled()) {
                    event.preventDefault();
                  }
                },
              },
              elementProps,
              focusableWhenDisabledProps(),
            ],
          }}
        />
      )}
    />
  );
}

export namespace ToolbarInput {
  export interface State extends ToolbarRoot.State {
    disabled: boolean;
    focusable: boolean;
  }

  export interface Props
    extends Omit<BaseUIComponentProps<'input', ToolbarRoot.State>, 'disabled'> {
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
    defaultValue?: MaybeAccessor<ComponentProps<'input'>['value'] | undefined>;
  }
}
