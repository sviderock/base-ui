import { splitComponentProps } from '../../solid-helpers';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { useSelectRootContext } from '../root/SelectRootContext';

const customStyleHookMapping: CustomStyleHookMapping<SelectBackdrop.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * An overlay displayed beneath the menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectBackdrop(componentProps: SelectBackdrop.Props) {
  const [, , elementProps] = splitComponentProps(componentProps, []);

  const { store } = useSelectRootContext();

  const state: SelectBackdrop.State = {
    get open() {
      return store.open;
    },
    get transitionStatus() {
      return store.transitionStatus;
    },
  };

  const element = useRenderElement('div', componentProps, {
    state,
    customStyleHookMapping,
    props: [
      {
        role: 'presentation',
        get hidden() {
          return !store.mounted;
        },
        style: {
          'user-select': 'none',
          '-webkit-user-select': 'none',
        },
      },
      elementProps,
    ],
  });

  return <>{element()}</>;
}

export namespace SelectBackdrop {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {
    /**
     * Whether the select menu is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
  }
}
