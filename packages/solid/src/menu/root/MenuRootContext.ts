import { createContext, useContext, type Accessor, type Setter } from 'solid-js';
import type { FloatingRootContext } from '../../floating-ui-solid';
import { TransitionStatus } from '../../utils';
import type { BaseUIHTMLProps, HTMLProps } from '../../utils/types';
import type { MenuParent, MenuRoot } from './MenuRoot';

export type InstantType = 'dismiss' | 'click' | 'group';

export interface MenuRootContext {
  disabled: Accessor<boolean>;
  typingRef: Accessor<boolean>;
  modal: Accessor<boolean>;
  activeIndex: Accessor<number | null>;
  floatingRootContext: FloatingRootContext;
  itemProps: (props: HTMLProps | BaseUIHTMLProps) => BaseUIHTMLProps;
  popupProps: (props: HTMLProps | BaseUIHTMLProps) => BaseUIHTMLProps;
  triggerProps: (props: HTMLProps | BaseUIHTMLProps) => BaseUIHTMLProps;
  itemDomElements: (HTMLElement | null | undefined)[];
  itemLabels: (string | null)[];
  mounted: Accessor<boolean>;
  open: Accessor<boolean>;
  popupRef: Accessor<HTMLElement | null | undefined>;
  setPopupRef: Setter<HTMLElement | null | undefined>;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: MenuRoot.OpenChangeReason | undefined,
  ) => void;
  positionerRef: Accessor<HTMLElement | null | undefined>;
  setPositionerElement: Setter<HTMLElement | null | undefined>;
  triggerElement: Accessor<HTMLElement | null | undefined>;
  setTriggerElement: Setter<HTMLElement | null | undefined>;
  transitionStatus: Accessor<TransitionStatus>;
  allowMouseUpTriggerRef: Accessor<boolean>;
  setAllowMouseUpTriggerRef: Setter<boolean>;
  lastOpenChangeReason: Accessor<MenuRoot.OpenChangeReason | null>;
  instantType: Accessor<InstantType | undefined>;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  setHoverEnabled: (hoverEnabled: boolean) => void;
  setActiveIndex: (activeIndex: number | null) => void;
  parent: Accessor<MenuParent>;
  rootId: Accessor<string | undefined>;
  allowMouseEnter: Accessor<boolean>;
  setAllowMouseEnter: (allowMouseEnter: boolean) => void;
}

export const MenuRootContext = createContext<MenuRootContext>();

export function useMenuRootContext(optional?: false): MenuRootContext;
export function useMenuRootContext(optional: true): MenuRootContext | undefined;
export function useMenuRootContext(optional?: boolean) {
  const context = useContext(MenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: MenuRootContext is missing. Menu parts must be placed within <Menu.Root>.',
    );
  }

  return context;
}
