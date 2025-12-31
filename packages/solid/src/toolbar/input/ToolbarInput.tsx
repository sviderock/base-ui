import { createMemo, type ComponentProps } from 'solid-js';
import { ARROW_LEFT, ARROW_RIGHT, stopEvent } from '../../composite/composite';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { mergeProps } from '../../merge-props/mergeProps';
import { splitComponentProps } from '../../solid-helpers';
import { BaseUIComponentProps } from '../../utils/types';
import { useFocusableWhenDisabled } from '../../utils/useFocusableWhenDisabled';
import { useRenderElement } from '../../utils/useRenderElement';
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
  const focusableWhenDisabled = () => local.focusableWhenDisabled ?? true;
  const disabledProp = () => local.disabled ?? false;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const itemMetadata = createMemo(() => ({ focusableWhenDisabled: focusableWhenDisabled() }));

  const disabled = () => toolbarDisabled() || (groupContext?.disabled() ?? false) || disabledProp();

  const { props: focusableWhenDisabledProps } = useFocusableWhenDisabled({
    composite: true,
    disabled,
    focusableWhenDisabled,
    isNativeButton: false,
  });

  const state: ToolbarInput.State = {
    get disabled() {
      return disabled();
    },
    get orientation() {
      return orientation();
    },
    get focusable() {
      return focusableWhenDisabled();
    },
  };

  const element = useRenderElement('input', componentProps, {
    state,
    props: [
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
      (props) => mergeProps(props, focusableWhenDisabledProps()),
    ],
  });

  return <CompositeItem<ToolbarRoot.ItemMetadata> metadata={itemMetadata} render={element} />;
}

export namespace ToolbarInput {
  export interface State extends ToolbarRoot.State {
    disabled: boolean;
    focusable: boolean;
  }

  export interface Props extends BaseUIComponentProps<'input', ToolbarRoot.State> {
    /**
     * When `true` the item remains focuseable when disabled.
     * @default true
     */
    focusableWhenDisabled?: boolean;
    defaultValue?: ComponentProps<'input'>['value'];
  }
}
