import { type JSX } from 'solid-js';
import type { HTMLProps } from '../utils/types';
import type { TransitionStatus } from '../utils/useTransitionStatus';

export type SelectStore = {
  id: string | undefined;
  modal: boolean;

  items: Record<string, JSX.Element> | Array<{ label: JSX.Element; value: any }> | undefined;
  value: any;
  label: string;

  open: boolean;
  mounted: boolean;
  forceMount: boolean;
  transitionStatus: TransitionStatus;
  touchModality: boolean;

  activeIndex: number | null;
  selectedIndex: number | null;

  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  triggerElement: HTMLElement | null | undefined;
  positionerElement: HTMLElement | null | undefined;

  scrollUpArrowVisible: boolean;
  scrollDownArrowVisible: boolean;
};
