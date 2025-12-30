'use client';
import { batch, createEffect, onCleanup, mergeProps as solidMergeProps, type JSX } from 'solid-js';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { fieldValidityMapping } from '../../field/utils/constants';
import { contains } from '../../floating-ui-solid/utils';
import { mergeProps } from '../../merge-props';
import { splitComponentProps } from '../../solid-helpers';
import { useButton } from '../../use-button';
import { getPseudoElementBounds } from '../../utils/getPseudoElementBounds';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { ownerDocument } from '../../utils/owner';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';
import { useSelectRootContext } from '../root/SelectRootContext';

const BOUNDARY_OFFSET = 2;

const customStyleHookMapping: CustomStyleHookMapping<SelectTrigger.State> = {
  ...pressableTriggerOpenStateMapping,
  ...fieldValidityMapping,
  value: () => null,
};

/**
 * A button that opens the select menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectTrigger(componentProps: SelectTrigger.Props) {
  const [, local, elementProps] = splitComponentProps(componentProps, ['disabled', 'nativeButton']);
  const disabledProp = () => local.disabled ?? false;
  const nativeButton = () => local.nativeButton ?? false;

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();
  const {
    store,
    setStore,
    setOpen,
    refs,
    fieldControlValidation,
    readOnly,
    disabled: selectDisabled,
  } = useSelectRootContext();

  const disabled = () => fieldDisabled() || selectDisabled() || disabledProp();

  const { labelId, setTouched, setFocused, validationMode } = useFieldRootContext();

  let triggerRef = null as HTMLElement | null | undefined;
  const timeoutFocus = useTimeout();
  const timeoutMouseDown = useTimeout();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const timeout1 = useTimeout();
  const timeout2 = useTimeout();

  createEffect(() => {
    if (store.open) {
      // mousedown -> move to unselected item -> mouseup should not select within 200ms.
      timeout2.start(200, () => {
        refs.selectionRef.allowUnselectedMouseUp = true;

        // mousedown -> mouseup on selected item should not select within 400ms.
        timeout1.start(200, () => {
          refs.selectionRef.allowSelectedMouseUp = true;
        });
      });

      onCleanup(() => {
        timeout1.clear();
        timeout2.clear();
      });
    }

    refs.selectionRef = {
      allowSelectedMouseUp: false,
      allowUnselectedMouseUp: false,
      allowSelect: true,
    };

    timeoutMouseDown.clear();
  });

  const state: SelectTrigger.State = solidMergeProps(fieldState, {
    get disabled() {
      return disabled();
    },
    get open() {
      return store.open;
    },
    get value() {
      return store.value;
    },
    get readOnly() {
      return readOnly();
    },
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: (el) => {
      triggerRef = el;
      buttonRef(el);
      setStore('triggerElement', el);
    },
    props: [
      (props) => mergeProps(props, store.triggerProps),
      {
        get 'aria-labelledby'() {
          return labelId();
        },
        get 'aria-readonly'() {
          return readOnly() || undefined;
        },
        get tabIndex() {
          return disabled() ? -1 : 0;
        },
        onFocus(event) {
          setFocused(true);
          // The popup element shouldn't obscure the focused trigger.
          if (store.open && refs.alignItemWithTriggerActiveRef) {
            setOpen(false, event, 'focus-out');
          }

          // Saves a re-render on initial click: `forceMount === true` mounts
          // the items before `open === true`. We could sync those cycles better
          // without a timeout, but this is enough for now.
          //
          // XXX: might be causing `act()` warnings.
          timeoutFocus.start(0, () => {
            setStore('forceMount', true);
          });
        },
        onBlur() {
          batch(() => {
            setTouched(true);
            setFocused(false);

            if (validationMode() === 'onBlur') {
              fieldControlValidation.commitValidation(store.value);
            }
          });
        },
        onPointerMove({ pointerType }) {
          refs.keyboardActiveRef = false;
          setStore('touchModality', pointerType === 'touch');
        },
        onPointerDown({ pointerType }) {
          setStore('touchModality', pointerType === 'touch');
        },
        onKeyDown(event) {
          refs.keyboardActiveRef = true;

          if (event.key === 'ArrowDown') {
            setOpen(true, event, 'list-navigation');
          }
        },
        onMouseDown(event) {
          if (store.open) {
            return;
          }

          const doc = ownerDocument(event.currentTarget);

          function handleMouseUp(mouseEvent: MouseEvent) {
            if (!triggerRef) {
              return;
            }

            const mouseUpTarget = mouseEvent.target as Element | null;

            // Early return if clicked on trigger element or its children
            if (
              contains(triggerRef, mouseUpTarget) ||
              contains(store.positionerElement, mouseUpTarget) ||
              mouseUpTarget === triggerRef
            ) {
              return;
            }

            const bounds = getPseudoElementBounds(triggerRef);

            if (
              mouseEvent.clientX >= bounds.left - BOUNDARY_OFFSET &&
              mouseEvent.clientX <= bounds.right + BOUNDARY_OFFSET &&
              mouseEvent.clientY >= bounds.top - BOUNDARY_OFFSET &&
              mouseEvent.clientY <= bounds.bottom + BOUNDARY_OFFSET
            ) {
              return;
            }

            setOpen(false, mouseEvent, 'cancel-open');
          }

          // Firefox can fire this upon mousedown
          timeoutMouseDown.start(0, () => {
            doc.addEventListener('mouseup', handleMouseUp, { once: true });
          });
        },
      },
      fieldControlValidation.getValidationProps,
      elementProps,
      getButtonProps,
      // ensure nested useButton does not overwrite the combobox role:
      // <Toolbar.Button render={<Select.Trigger />} />
      { role: 'combobox' },
    ],
    customStyleHookMapping,
  });

  return <>{element()}</>;
}

export namespace SelectTrigger {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: JSX.Element;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: boolean;
  }

  export interface State extends FieldRoot.State {
    /**
     * Whether the select menu is currently open.
     */
    open: boolean;
    /**
     * Whether the select menu is readonly.
     */
    readOnly: boolean;
    /**
     * The value of the currently selected item.
     */
    value: any;
  }
}
