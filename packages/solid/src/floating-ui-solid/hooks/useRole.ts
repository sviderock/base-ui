import { createEffect, createMemo, createSignal, onMount, type Accessor, type JSX } from 'solid-js';
import { access, type MaybeAccessor } from '../../solid-helpers';
import { useId } from '../../utils/useId';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import type { ElementProps, FloatingRootContext } from '../types';
import { getFloatingFocusElement } from '../utils';
import type { ExtendedUserProps } from './useInteractions';

type AriaRole = 'tooltip' | 'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'grid' | 'tree';
type ComponentRole = 'select' | 'label' | 'combobox';

export interface UseRoleProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean>;
  /**
   * The role of the floating element.
   * @default 'dialog'
   */
  role?: MaybeAccessor<AriaRole | ComponentRole>;
}

const componentRoleToAriaRoleMap = new Map<AriaRole | ComponentRole, AriaRole | false>([
  ['select', 'listbox'],
  ['combobox', 'listbox'],
  ['label', false],
]);

/**
 * Adds base screen reader props to the reference and floating elements for a
 * given floating element `role`.
 * @see https://floating-ui.com/docs/useRole
 */
export function useRole(
  context: FloatingRootContext,
  props: UseRoleProps = {},
): Accessor<ElementProps> {
  const enabled = () => access(props.enabled) ?? true;
  const role = () => access(props.role) ?? 'dialog';

  const defaultReferenceId = useId();
  /**
   * TODO: this needs to be memoized as it causes an infinite loop
   * with the MenuRoot triggerElement assignement
   */
  const referenceId = createMemo(() => context.elements.domReference()?.id || defaultReferenceId());

  // Track the actual floating element id (including user-provided custom id) after mount.
  const [resolvedFloatingId, setResolvedFloatingId] = createSignal<string | undefined>(undefined);
  createEffect(() => {
    const element = getFloatingFocusElement(context.elements.floating());
    setResolvedFloatingId(element?.id);
  });
  const floatingId = createMemo(() => resolvedFloatingId() || context.floatingId());

  const ariaRole = () =>
    (componentRoleToAriaRoleMap.get(role()) ?? role()) as AriaRole | false | undefined;

  const parentId = useFloatingParentNodeId();
  const isNested = parentId != null;

  const reference = createMemo<ElementProps['reference']>(() => {
    if (ariaRole() === 'tooltip' || role() === 'label') {
      return {
        [`aria-${role() === 'label' ? 'labelledby' : 'describedby'}`]: context.open()
          ? floatingId()
          : undefined,
      };
    }

    return {
      'aria-expanded': context.open() ? 'true' : 'false',
      'aria-haspopup': ariaRole() === 'alertdialog' ? 'dialog' : ariaRole(),
      'aria-controls': context.open() ? floatingId() : undefined,
      ...(ariaRole() === 'listbox' && { role: 'combobox' }),
      ...(ariaRole() === 'menu' && { id: referenceId() }),
      ...(ariaRole() === 'menu' && isNested && { role: 'menuitem' }),
      ...(role() === 'select' && { 'aria-autocomplete': 'none' }),
      ...(role() === 'combobox' && { 'aria-autocomplete': 'list' }),
    } as JSX.HTMLAttributes<Element>;
  });

  const floating = createMemo<ElementProps['floating']>(() => {
    const floatingProps = {
      id: floatingId(),
      ...(ariaRole() && { role: ariaRole() }),
    } as JSX.HTMLAttributes<HTMLElement>;

    if (ariaRole() === 'tooltip' || role() === 'label') {
      return floatingProps;
    }

    return {
      ...floatingProps,
      ...(ariaRole() === 'menu' && { 'aria-labelledby': referenceId() }),
    };
  });

  const item: ElementProps['item'] = (params: ExtendedUserProps) => {
    const commonProps = {
      role: 'option',
      ...(params.active && { id: `${floatingId()}-fui-option` }),
    };

    // For `menu`, we are unable to tell if the item is a `menuitemradio`
    // or `menuitemcheckbox`. For backwards-compatibility reasons, also
    // avoid defaulting to `menuitem` as it may overwrite custom role props.
    switch (role()) {
      case 'select':
        return {
          ...commonProps,
          'aria-selected': params.active && params.selected,
        };
      case 'combobox': {
        return {
          ...commonProps,
          'aria-selected': params.selected,
        };
      }
      default:
    }

    return {};
  };

  const returnValue = createMemo<ElementProps>(() => {
    if (!enabled()) {
      return {};
    }

    return { reference: reference(), floating: floating(), item };
  });

  return returnValue;
}
